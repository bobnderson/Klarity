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
public class LocationsController : ControllerBase
{
    private readonly ILocationRepository _locationRepository;
    private readonly IAuditService _auditService;

    public LocationsController(ILocationRepository locationRepository, IAuditService auditService)
    {
        _locationRepository = locationRepository;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Location>>> GetLocations()
    {
        var locations = await _locationRepository.GetLocationsAsync();
        return Ok(locations);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Location>> GetLocation(string id)
    {
        var location = await _locationRepository.GetLocationByIdAsync(id);
        if (location == null) return NotFound();
        return Ok(location);
    }

    [HttpPost]
    public async Task<ActionResult<Location>> CreateLocation(Location location)
    {
        var existing = await _locationRepository.GetLocationByIdAsync(location.LocationId);
        if (existing != null) return Conflict($"Location with ID '{location.LocationId}' already exists.");

        await _locationRepository.CreateLocationAsync(location);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Create Location", true, "Locations", System.Text.Json.JsonSerializer.Serialize(location));
        return CreatedAtAction(nameof(GetLocation), new { id = location.LocationId }, location);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLocation(string id, Location location)
    {
        if (id != location.LocationId) return BadRequest("Path ID and Location ID mismatch.");

        await _locationRepository.UpdateLocationAsync(location);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Update Location", true, "Locations", System.Text.Json.JsonSerializer.Serialize(location));
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLocation(string id)
    {
        await _locationRepository.DeleteLocationAsync(id);
        await _auditService.LogAsync(User.Identity?.Name ?? "system", "Delete Location", true, "Locations", id);
        return NoContent();
    }
}
