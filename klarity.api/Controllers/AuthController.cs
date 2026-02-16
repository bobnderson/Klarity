using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Klarity.Api.Data;
using Klarity.Api.Models;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace Klarity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly Services.IAuditService _auditService;
    private readonly Data.IAuthRepository _authRepository;

    public AuthController(
        IConfiguration configuration,
        ILogger<AuthController> logger,
        Services.IAuditService auditService,
        Data.IAuthRepository authRepository)
    {
        _configuration = configuration;
        _logger = logger;
        _auditService = auditService;
        _authRepository = authRepository;
    }

    [HttpGet("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login()
    {
        var samAccountNameResult = ResolveAccountName();
        if (samAccountNameResult.Error != null)
        {
            return samAccountNameResult.Error;
        }

        string samAccountName = samAccountNameResult.Value!;

        try 
        {
            var loginData = await _authRepository.GetLoginDataAsync(samAccountName);

            if (loginData.User == null)
            {
                _logger.LogWarning("User {SamAccountName} not found or inactive.", samAccountName);
                await _auditService.LogAsync(samAccountName, "Login", false, "Auth", requestBody: null, error: "User not found or inactive.");
                return Unauthorized("User account not found or inactive.");
            }

            var response = new LoginResponse
            {
                AccountId = loginData.User.AccountId,
                AccountName = loginData.User.AccountName,
                LastLogin = loginData.User.LastLogin?.ToString() ?? string.Empty,
                Roles = loginData.Roles.ToList()
            };

            if (!response.Roles.Any())
            {
                _logger.LogWarning("User {SamAccountName} has no roles assigned.", samAccountName);
                await _auditService.LogAsync(samAccountName, "Login", false, "Auth", requestBody: null, error: "No roles assigned.");
                return Unauthorized("User has no roles assigned.");
            }

            response.Menus = BuildHierarchicalMenu(loginData.Menus);
            response.Jwt = GenerateJwtToken(response.AccountId, response.Roles);

            await _authRepository.UpdateLastLoginAsync(samAccountName);
            await _auditService.LogAsync(samAccountName, "Login", true, "Auth");

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for {SamAccountName}", samAccountName);
            await _auditService.LogAsync(samAccountName, "Login", false, "Auth", requestBody: null, error: ex.Message);
            return StatusCode(500, "An internal error occurred during login.");
        }
    }

    private (string? Value, IActionResult? Error) ResolveAccountName()
    {
        var useDevUser = _configuration.GetValue<bool>("DevAuth:UseDevUser");

        if (useDevUser)
        {
            var devUser = _configuration["DevAuth:DummyUser:SamAccountName"] ?? "dev.user";
            _logger.LogInformation("Using Dev Dummy Identity: {SamAccountName}", devUser);
            return (devUser, null);
        }

        var windowsIdentity = User.Identity;
        if (windowsIdentity == null || !windowsIdentity.IsAuthenticated)
        {
            _logger.LogWarning("Unauthorized login attempt: Windows Identity not found.");
            return (null, Unauthorized("Windows identity not found."));
        }

        var samAccountName = windowsIdentity.Name?.Split('\\').Last() ?? string.Empty;
        _logger.LogInformation("Login attempt for User: {SamAccountName}", samAccountName);
        return (samAccountName, null);
    }

    private List<MenuItemConfig> BuildHierarchicalMenu(IEnumerable<dynamic> flatMenus)
    {
        var menus = flatMenus
            .GroupBy(m => (string)m.GroupLabel)
            .Select(g => new MenuItemConfig
            {
                Label = g.Key,
                Children = g.Select(c => new MenuItemConfig
                {
                    Label = (string)c.ItemLabel,
                    Path = (string)c.ItemPath
                }).ToList()
            }).ToList();

        // Inject Aviation Menu for Development/Demo
        var aviationMenu = menus.FirstOrDefault(m => m.Label == "Aviation");
        var aviationItems = new List<MenuItemConfig>
        {
            new MenuItemConfig { Label = "Dashboard", Path = "/aviation-dashboard" },
            new MenuItemConfig { Label = "Planner", Path = "/aviation-planner" },
            new MenuItemConfig { Label = "Request", Path = "/aviation-request" },
            new MenuItemConfig { Label = "Helicopters", Path = "/aviation-helicopters" },
            new MenuItemConfig { Label = "Schedules", Path = "/aviation-schedules" }
        };

        if (aviationMenu != null)
        {
            // Add items that aren't already there
            foreach (var item in aviationItems)
            {
                if (!aviationMenu.Children.Any(c => c.Label == item.Label))
                {
                    aviationMenu.Children.Add(item);
                }
            }
        }
        else
        {
            menus.Add(new MenuItemConfig
            {
                Label = "Aviation",
                Children = aviationItems
            });
        }

        return menus;
    }

    private string GenerateJwtToken(string accountId, List<UserRoleConfig> roles)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "SecretKeyForKlarityAppAuth2025!Fix"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, accountId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role.RoleName));
            claims.Add(new Claim("roleId", role.RoleId));
        }

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "KlarityApi",
            audience: _configuration["Jwt:Audience"] ?? "KlarityClient",
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
