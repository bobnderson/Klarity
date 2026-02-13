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
public class RolesController : ControllerBase
{
    private readonly IAdminRepository _adminRepository;
    private readonly IAuditService _auditService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(
        IAdminRepository adminRepository, 
        IAuditService auditService, 
        ILogger<RolesController> logger)
    {
        _adminRepository = adminRepository;
        _auditService = auditService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Role>>> GetRoles()
    {
        var roles = await _adminRepository.GetRolesAsync();
        return Ok(roles);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Role>> GetRole(string id)
    {
        var role = await _adminRepository.GetRoleByIdAsync(id);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpGet("menu-items")]
    public async Task<ActionResult<IEnumerable<MenuItemOptionDto>>> GetMenuItems()
    {
        var items = await _adminRepository.GetMenuItemOptionsAsync();
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<Role>> CreateRole(CreateRoleDto dto)
    {
        var roleId = dto.RoleName.ToLower().Replace(" ", "-").Replace(".", "-");

        var existing = await _adminRepository.GetRoleByIdAsync(roleId);
        if (existing != null) return Conflict($"Role with ID '{roleId}' already exists.");

        var role = new Role
        {
            RoleId = roleId,
            RoleName = dto.RoleName,
            Description = dto.Description,
            MenuItemIds = dto.MenuItemIds
        };

        await _adminRepository.CreateRoleAsync(role);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Create Role", true, "Roles", System.Text.Json.JsonSerializer.Serialize(role));
        return CreatedAtAction(nameof(GetRole), new { id = role.RoleId }, role);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRole(string id, Role role)
    {
        if (id != role.RoleId) return BadRequest("Path ID and Role ID mismatch.");
        
        await _adminRepository.UpdateRoleAsync(role);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Update Role", true, "Roles", System.Text.Json.JsonSerializer.Serialize(role));
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(string id)
    {
        await _adminRepository.DeleteRoleAsync(id);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Delete Role", true, "Roles", id);
        return NoContent();
    }
}
