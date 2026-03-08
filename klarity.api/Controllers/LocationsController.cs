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
public class LocationsController : ControllerBase
{
    private readonly ILocationRepository _locationRepository;
    public LocationsController(ILocationRepository locationRepository)
    {
        _locationRepository = locationRepository;
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
    [Audit("Create Location")]
    public async Task<ActionResult<Location>> CreateLocation(Location location)
    {
        var existing = await _locationRepository.GetLocationByIdAsync(location.LocationId);
        if (existing != null) return Conflict($"Location with ID '{location.LocationId}' already exists.");

        await _locationRepository.CreateLocationAsync(location);
        return CreatedAtAction(nameof(GetLocation), new { id = location.LocationId }, location);
    }

    [HttpPut("{id}")]
    [Audit("Update Location")]
    public async Task<IActionResult> UpdateLocation(string id, Location location)
    {
        if (id != location.LocationId) return BadRequest("Path ID and Location ID mismatch.");

        await _locationRepository.UpdateLocationAsync(location);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Audit("Delete Location")]
    public async Task<IActionResult> DeleteLocation(string id)
    {
        await _locationRepository.DeleteLocationAsync(id);
        return NoContent();
    }
}
