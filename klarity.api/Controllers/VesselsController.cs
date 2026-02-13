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
public class VesselsController : ControllerBase
{
    private readonly IVesselRepository _vesselRepository;
    private readonly IAuditService _auditService;

    public VesselsController(IVesselRepository vesselRepository, IAuditService auditService)
    {
        _vesselRepository = vesselRepository;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vessel>>> GetVessels()
    {
        var vessels = await _vesselRepository.GetVesselsAsync();
        return Ok(vessels);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vessel>> GetVessel(string id)
    {
        var vessel = await _vesselRepository.GetVesselByIdAsync(id);
        if (vessel == null) return NotFound();
        return Ok(vessel);
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<VesselCategory>>> GetCategories()
    {
        var categories = await _vesselRepository.GetCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<IEnumerable<VesselStatus>>> GetStatuses()
    {
        var statuses = await _vesselRepository.GetVesselStatusesAsync();
        return Ok(statuses);
    }

    [HttpPost]
    public async Task<ActionResult<Vessel>> CreateVessel(Vessel vessel)
    {
        if (string.IsNullOrEmpty(vessel.VesselId))
        {
            vessel.VesselId = "v-" + Guid.NewGuid().ToString("n").Substring(0, 8);
        }

        var existing = await _vesselRepository.GetVesselByIdAsync(vessel.VesselId);
        if (existing != null) return Conflict($"Vessel with ID '{vessel.VesselId}' already exists.");

        await _vesselRepository.CreateVesselAsync(vessel);
        var created = await _vesselRepository.GetVesselByIdAsync(vessel.VesselId);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Create Vessel", true, "Vessels", System.Text.Json.JsonSerializer.Serialize(created ?? vessel));
        return CreatedAtAction(nameof(GetVessel), new { id = vessel.VesselId }, created ?? vessel);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Vessel>> UpdateVessel(string id, Vessel vessel)
    {
        if (id != vessel.VesselId) return BadRequest("Path ID and Vessel ID mismatch.");

        await _vesselRepository.UpdateVesselAsync(vessel);
        
        // Fetch the fully populated object to return
        var updated = await _vesselRepository.GetVesselByIdAsync(id);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "system", 
            "Update Vessel", 
            true, 
            "Vessels", 
            System.Text.Json.JsonSerializer.Serialize(updated ?? vessel)
        );
        
        return Ok(updated ?? vessel);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVessel(string id, [FromBody] DeletionRequest? request)
    {
        await _vesselRepository.DeleteVesselAsync(id);
        await _auditService.LogAsync(
            User.Identity?.Name ?? "system", 
            "Delete Vessel", 
            true, 
            "Vessels", 
            $"ID: {id}, Reason: {request?.Reason ?? "No reason provided"}"
        );
        return NoContent();
    }

    public class DeletionRequest
    {
        public string? Reason { get; set; }
    }
}
