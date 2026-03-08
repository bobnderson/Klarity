using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using Klarity.Api.Data;
using Klarity.Api.Models;
using Klarity.Api.Services;
using Klarity.Api.Utils;
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
    private readonly Data.IAdminRepository _adminRepository; // Added
    private readonly Utils.Security _security;
    private readonly IEmailService _emailService; // Added
    
    public AuthController(
        IConfiguration configuration,
        ILogger<AuthController> logger,
        Services.IAuditService auditService,
        Data.IAuthRepository authRepository,
        Data.IAdminRepository adminRepository, // Added
        Utils.Security security,
        IEmailService emailService) // Added
    {
        _configuration = configuration;
        _logger = logger;
        _auditService = auditService;
        _authRepository = authRepository;
        _adminRepository = adminRepository; // Added
        _security = security;
        _emailService = emailService; // Added
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
            response.Jwt = _security.GenerateToken(new { AccountId = response.AccountId, Roles = response.Roles });

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

    [HttpPost("login/external")]
    [AllowAnonymous]
    public async Task<IActionResult> LoginExternal([FromBody] ExternalLoginRequest request)
    {
        try
        {
            var loginData = await _authRepository.GetLoginDataAsync(request.Username);

            if (loginData.User == null || !loginData.User.IsExternal)
            {
                _logger.LogWarning("External login failed: User {Username} not found or not external.", request.Username);
                return Unauthorized("Invalid username or password.");
            }

            if (!_security.VerifyPassword(request.Password, loginData.User.PasswordHash ?? string.Empty))
            {
                _logger.LogWarning("External login failed: Invalid password for {Username}.", request.Username);
                return Unauthorized("Invalid username or password.");
            }

            var response = new LoginResponse
            {
                AccountId = loginData.User.AccountId,
                AccountName = loginData.User.AccountName,
                LastLogin = loginData.User.LastLogin?.ToString() ?? string.Empty,
                Roles = loginData.Roles.ToList(),
                MustChangePassword = loginData.User.MustChangePassword
            };

            if (!response.Roles.Any())
            {
                return Unauthorized("User has no roles assigned.");
            }

            response.Menus = BuildHierarchicalMenu(loginData.Menus);
            response.Jwt = _security.GenerateToken(new { AccountId = response.AccountId, Roles = response.Roles });

            await _authRepository.UpdateLastLoginAsync(request.Username);
            await _auditService.LogAsync(request.Username, "External Login", true, "Auth");

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during external login for {Username}", request.Username);
            return StatusCode(500, "An internal error occurred during login.");
        }
    }

    [HttpPost("change-password")]
    [Klarity.Api.Utils.TokenAuthorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var accountId = _security.GetAccountIdFromRequest(Request);
        if (accountId == "Unknown") return Unauthorized();

        var loginData = await _authRepository.GetLoginDataAsync(accountId);
        if (loginData.User == null || !loginData.User.IsExternal)
            return BadRequest("Only external users can change passwords this way.");

        if (!_security.VerifyPassword(request.CurrentPassword, loginData.User.PasswordHash ?? string.Empty))
            return BadRequest("Current password is incorrect.");

        var validation = _security.ValidatePassword(request.NewPassword);
        if (!validation.IsValid) return BadRequest(validation.Message);

        var newHash = _security.HashPassword(request.NewPassword);
        await _adminRepository.UpdatePasswordHashAsync(accountId, newHash);
        
        await _auditService.LogAsync(accountId, "Change Password", true, "Auth");
        return Ok(new { message = "Password changed successfully." });
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

        return menus;
    }


}
