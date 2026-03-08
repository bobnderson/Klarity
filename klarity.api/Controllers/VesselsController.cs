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
public class VesselsController : ControllerBase
{
    private readonly IVesselRepository _vesselRepository;
    public VesselsController(IVesselRepository vesselRepository)
    {
        _vesselRepository = vesselRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vessel>>> GetVessels([FromQuery] string? category = null, [FromQuery] string mode = "Marine")
    {
        var vessels = await _vesselRepository.GetVesselsAsync(category, mode);
        return Ok(vessels);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vessel>> GetVessel(string id, [FromQuery] string mode = "Marine")
    {
        var vessel = await _vesselRepository.GetVesselByIdAsync(id, mode);
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
    [Audit("Create Vessel")]
    public async Task<ActionResult<Vessel>> CreateVessel(Vessel vessel, [FromQuery] string mode = "Marine")
    {
        if (string.IsNullOrEmpty(vessel.VesselId))
        {
            vessel.VesselId = "v-" + Guid.NewGuid().ToString("n").Substring(0, 8);
        }

        var existing = await _vesselRepository.GetVesselByIdAsync(vessel.VesselId, mode);
        if (existing != null) return Conflict($"Vessel with ID '{vessel.VesselId}' already exists.");

        await _vesselRepository.CreateVesselAsync(vessel, mode);
        var created = await _vesselRepository.GetVesselByIdAsync(vessel.VesselId, mode);
        return CreatedAtAction(nameof(GetVessel), new { id = vessel.VesselId, mode = mode }, created ?? vessel);
    }

    [HttpPut("{id}")]
    [Audit("Update Vessel")]
    public async Task<ActionResult<Vessel>> UpdateVessel(string id, Vessel vessel, [FromQuery] string mode = "Marine")
    {
        if (id != vessel.VesselId) return BadRequest("Path ID and Vessel ID mismatch.");

        await _vesselRepository.UpdateVesselAsync(vessel, mode);
        
        // Fetch the fully populated object to return
        var updated = await _vesselRepository.GetVesselByIdAsync(id, mode);
        
        return Ok(updated ?? vessel);
    }

    [HttpDelete("{id}")]
    [Audit("Delete Vessel")]
    public async Task<IActionResult> DeleteVessel(string id, [FromBody] DeletionRequest? request, [FromQuery] string mode = "Marine")
    {
        await _vesselRepository.DeleteVesselAsync(id, mode);
        return NoContent();
    }

    public class DeletionRequest
    {
        public string? Reason { get; set; }
    }
}
