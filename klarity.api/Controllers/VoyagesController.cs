using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Models;
using Klarity.Api.Models.Optimization;
using Klarity.Api.Data;
using Klarity.Api.Attributes;
using Klarity.Api.Services;
using Klarity.Api.Services.Optimization;

namespace Klarity.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class VoyagesController : ControllerBase
{
    private readonly IVoyageRepository _repository;
    private readonly IVesselRepository _vesselRepository;
    private readonly IMovementRequestRepository _requestRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly IVoyageOptimizerService _optimizerService;
    private readonly IAuditService _auditService;

    public VoyagesController(
        IVoyageRepository repository, 
        IVesselRepository vesselRepository,
        IMovementRequestRepository requestRepository,
        ILocationRepository locationRepository,
        IVoyageOptimizerService optimizerService,
        IAuditService auditService)
    {
        _repository = repository;
        _vesselRepository = vesselRepository;
        _requestRepository = requestRepository;
        _locationRepository = locationRepository;
        _optimizerService = optimizerService;
        _auditService = auditService;
    }

    [HttpGet("statuses")]
    public async Task<ActionResult<IEnumerable<VoyageStatus>>> GetVoyageStatuses()
    {
        var statuses = await _repository.GetVoyageStatusesAsync();
        return Ok(statuses);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Voyage>>> GetVoyages()
    {
        var voyages = await _repository.GetVoyagesAsync();
        return Ok(voyages);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Voyage>> GetVoyage(string id)
    {
        var voyage = await _repository.GetVoyageByIdAsync(id);
        if (voyage == null) return NotFound();
        return Ok(voyage);
    }

    [HttpGet("date-range")]
    public async Task<ActionResult<IEnumerable<Voyage>>> GetVoyagesByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var voyages = await _repository.GetVoyagesByDateRangeAsync(startDate, endDate);
        return Ok(voyages);
    }

    [HttpGet("vessel/{vesselId}")]
    public async Task<ActionResult<IEnumerable<Voyage>>> GetVoyagesByVessel(string vesselId)
    {
        var voyages = await _repository.GetVoyagesByVesselIdAsync(vesselId);
        return Ok(voyages);
    }

    [HttpPost]
    [ValidateModel]
    public async Task<ActionResult<Voyage>> CreateVoyage(Voyage voyage)
    {
        if (string.IsNullOrEmpty(voyage.VoyageId))
        {
            voyage.VoyageId = "voy-" + Guid.NewGuid().ToString("n").Substring(0, 8);
        }

        await _repository.CreateVoyageAsync(voyage);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Create Voyage",
            true,
            "Voyages",
            System.Text.Json.JsonSerializer.Serialize(voyage)
        );

        return CreatedAtAction(nameof(GetVoyage), new { id = voyage.VoyageId }, voyage);
    }

    [HttpPut("{id}")]
    [ValidateModel]
    public async Task<IActionResult> UpdateVoyage(string id, Voyage voyage)
    {
        if (id != voyage.VoyageId) return BadRequest("ID mismatch");

        await _repository.UpdateVoyageAsync(voyage);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Update Voyage",
            true,
            "Voyages",
            System.Text.Json.JsonSerializer.Serialize(voyage)
        );

        return Ok(voyage);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVoyage(string id)
    {
        await _repository.DeleteVoyageAsync(id);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Delete Voyage",
            true,
            "Voyages",
            $"Voyage deleted: {id}"
        );

        return NoContent();
    }

    [HttpGet("{id}/manifest")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetManifest(string id)
    {
        var manifest = await _repository.GetVoyageManifestAsync(id);
        return Ok(manifest);
    }

    [HttpPost("{id}/assign-items")]
    public async Task<IActionResult> AssignItems(string id, [FromBody] AssignmentRequest request)
    {
        await _repository.AssignItemsToVoyageAsync(id, request.ItemIds);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Assign Items to Voyage",
            true,
            "Voyages",
            $"Voyage: {id}, Items: {string.Join(",", request.ItemIds)}"
        );

        return Ok(new { Success = true });
    }

    [HttpPost("{id}/unassign-items")]
    public async Task<IActionResult> UnassignItems(string id, [FromBody] AssignmentRequest request)
    {
        await _repository.UnassignItemsFromVoyageAsync(id, request.ItemIds);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Unassign Items from Voyage",
            true,
            "Voyages",
            $"Voyage: {id}, Items: {string.Join(",", request.ItemIds)}"
        );

        return Ok(new { Success = true });
    }

    [HttpPost("optimize")]
    public async Task<ActionResult<IEnumerable<VoyageCandidate>>> Optimize()
    {
        var vessels = (await _vesselRepository.GetVesselsAsync()).ToList();
        var requests = (await _requestRepository.GetUnscheduledMovementRequestsAsync()).ToList();
        var locations = (await _locationRepository.GetLocationsAsync()).ToList();
        var existingVoyages = (await _repository.GetVoyagesAsync()).ToList();

        var recommendations = _optimizerService.OptimiseVoyagePlan(
            requests,
            vessels,
            locations,
            existingVoyages
        );

        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Optimize Voyages",
            true,
            "Voyages",
            $"Generated {recommendations.Count} recommendations"
        );

        return Ok(recommendations);
    }

    public class AssignmentRequest
    {
        public List<string> ItemIds { get; set; } = new();
    }
}
