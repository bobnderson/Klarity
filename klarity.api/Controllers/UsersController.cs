using Klarity.Api.Attributes;
using Klarity.Api.Data;
using Klarity.Api.Models;
using Klarity.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Klarity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[ValidateModel]
public class UsersController : ControllerBase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IAuditService _auditService;
    private readonly IActiveDirectoryService _adService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IAdminRepository adminRepository, 
        IAuditService auditService, 
        IActiveDirectoryService adService,
        ILogger<UsersController> logger)
    {
        _adminRepository = adminRepository;
        _auditService = auditService;
        _adService = adService;
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
    public async Task<ActionResult<User>> CreateUser(User user)
    {
        await _adminRepository.CreateUserAsync(user);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Create User", true, "Users", System.Text.Json.JsonSerializer.Serialize(user));
        return CreatedAtAction(nameof(GetUser), new { id = user.AccountId }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, User user)
    {
        if (id != user.AccountId) return BadRequest();
        
        await _adminRepository.UpdateUserAsync(user);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Update User", true, "Users", System.Text.Json.JsonSerializer.Serialize(user));
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        await _adminRepository.DeleteUserAsync(id);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Delete User", true, "Users", id);
        return NoContent();
    }
}
