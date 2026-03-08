using Klarity.Api.Attributes;
using Klarity.Api.Data;
using Klarity.Api.Models;
using Klarity.Api.Services;
using Klarity.Api.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Klarity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[TokenAuthorize]
[ValidateModel]
public class UsersController : ControllerBase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IActiveDirectoryService _adService;
    private readonly IEmailService _emailService;
    private readonly Utils.Security _security;
    private readonly ILogger<UsersController> _logger;
    
    public UsersController(
        IAdminRepository adminRepository, 
        IActiveDirectoryService adService,
        IEmailService emailService,
        Utils.Security security,
        ILogger<UsersController> logger)
    {
        _adminRepository = adminRepository;
        _adService = adService;
        _emailService = emailService;
        _security = security;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var users = await _adminRepository.GetUsersAsync();
        return Ok(users);
    }

    [HttpGet("search-ad")]
    public async Task<ActionResult<IEnumerable<AdUserDto>>> SearchAdUsers([FromQuery] string query)
    {
        var users = await _adService.SearchUsersAsync(query);
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(string id)
    {
        var user = await _adminRepository.GetUserByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    [Audit("Create User")]
    public async Task<ActionResult<User>> CreateUser(User user)
    {
        if (user.IsExternal)
        {
            if (string.IsNullOrEmpty(user.Email))
                return BadRequest("Email is required for external users.");

            if (string.IsNullOrEmpty(user.Password))
                return BadRequest("Password is required for external users.");

            var validation = _security.ValidatePassword(user.Password);
            if (!validation.IsValid)
                return BadRequest(validation.Message);

            user.PasswordHash = _security.HashPassword(user.Password);
            user.MustChangePassword = true;
            
            try
            {
                var body = $@"
                    <h3>Account Created</h3>
                    <p>Hello {user.AccountName},</p>
                    <p>Your Klarity account has been created. Here are your credentials:</p>
                    <ul>
                        <li><b>Username:</b> {user.AccountId}</li>
                        <li><b>Password:</b> {user.Password}</li>
                    </ul>
                    <p>You will be prompted to change your password on your first login.</p>
                ";
                await _emailService.SendEmailAsync(user.Email, "Klarity Account Created", body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send account creation email to {Email}", user.Email);
            }

            var plainPassword = user.Password;
            user.Password = null;
        }

        await _adminRepository.CreateUserAsync(user);
        return CreatedAtAction(nameof(GetUser), new { id = user.AccountId }, user);
    }

    [HttpPut("{id}")]
    [Audit("Update User")]
    public async Task<IActionResult> UpdateUser(string id, User user)
    {
        if (id != user.AccountId) return BadRequest();
        
        await _adminRepository.UpdateUserAsync(user);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Audit("Delete User")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        await _adminRepository.DeleteUserAsync(id);
        return NoContent();
    }
}
