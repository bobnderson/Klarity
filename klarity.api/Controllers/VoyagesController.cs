using Klarity.Api.Utils;
using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Models;
using Klarity.Api.Models.Optimization;
using Klarity.Api.Data;
using Klarity.Api.Attributes;
using Klarity.Api.Services;
using Klarity.Api.Services.Optimization;

namespace Klarity.Api.Controllers;

[TokenAuthorize]
[ApiController]
[Route("api/[controller]")]
public class VoyagesController : ControllerBase
{
    private readonly IVoyageRepository _repository;
    private readonly IVesselRepository _vesselRepository;
    private readonly IMovementRequestRepository _requestRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly IVoyageOptimizerService _optimizerService;
    private readonly IManifestExportService _manifestExportService;

    public VoyagesController(
        IVoyageRepository repository, 
        IVesselRepository vesselRepository,
        IMovementRequestRepository requestRepository,
        ILocationRepository locationRepository,
        IVoyageOptimizerService optimizerService,
        IManifestExportService manifestExportService)
    {
        _repository = repository;
        _vesselRepository = vesselRepository;
        _requestRepository = requestRepository;
        _locationRepository = locationRepository;
        _optimizerService = optimizerService;
        _manifestExportService = manifestExportService;
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
    [Audit("Create Voyage")]
    public async Task<ActionResult<Voyage>> CreateVoyage(Voyage voyage)
    {
        await _repository.CreateVoyageAsync(voyage);
        return CreatedAtAction(nameof(GetVoyage), new { id = voyage.VoyageId }, voyage);
    }

    [HttpPut("{id}")]
    [ValidateModel]
    [Audit("Update Voyage")]
    public async Task<IActionResult> UpdateVoyage(string id, Voyage voyage)
    {
        if (id != voyage.VoyageId) return BadRequest("ID mismatch");

        await _repository.UpdateVoyageAsync(voyage);
        return Ok(voyage);
    }

    [HttpDelete("{id}")]
    [Audit("Delete Voyage")]
    public async Task<IActionResult> DeleteVoyage(string id)
    {
        await _repository.DeleteVoyageAsync(id);
        return NoContent();
    }

    [HttpGet("{id}/manifest")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetManifest(string id)
    {
        var manifest = await _repository.GetVoyageManifestAsync(id);
        return Ok(manifest);
    }

    [HttpGet("{id}/manifest/download")]
    public async Task<IActionResult> DownloadManifest(string id)
    {
        try
        {
            var voyage = await _repository.GetVoyageByIdAsync(id);
            if (voyage == null) return NotFound("Voyage not found");

            var vessel = await _vesselRepository.GetVesselByIdAsync(voyage.VesselId);
            var manifest = await _repository.GetVoyageManifestAsync(id);

            var pdfBytes = _manifestExportService.GenerateManifestPdf(new ManifestExportData
            {
                Identifier = voyage.VoyageId,
                VesselName = vessel?.VesselName ?? voyage.VesselId,
                Route = $"{voyage.OriginName ?? voyage.OriginId} to {voyage.DestinationName ?? voyage.DestinationId}",
                Departure = voyage.DepartureDateTime.ToString("dd MMM yyyy HH:mm"),
                Arrival = voyage.Eta.ToString("dd MMM yyyy HH:mm"),
                WeightUtil = voyage.WeightUtil,
                DeckUtil = voyage.DeckUtil,
                Manifest = manifest,
                IsAviation = false,
                Status = voyage.StatusId ?? "scheduled"
            });

            return File(pdfBytes, "application/pdf", $"Manifest_{vessel?.VesselName ?? "Vessel"}_{id}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error generating PDF: {ex.Message}");
        }
    }

    [HttpPost("{id}/assign-items")]
    [Audit("Assign Items to Voyage")]
    public async Task<IActionResult> AssignItems(string id, [FromBody] VoyageAssignmentRequest request)
    {
        await _repository.AssignItemsToVoyageAsync(id, request.ItemIds);
        return Ok(new { Success = true });
    }

    [HttpPost("{id}/unassign-items")]
    [Audit("Unassign Items from Voyage")]
    public async Task<IActionResult> UnassignItems(string id, [FromBody] VoyageAssignmentRequest request)
    {
        await _repository.UnassignItemsFromVoyageAsync(id, request.ItemIds);
        return Ok(new { Success = true });
    }

    [HttpPost("optimize")]
    [Audit("Optimize Voyages")]
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

        return Ok(recommendations);
    }

    public class VoyageAssignmentRequest
    {
        public List<string> ItemIds { get; set; } = new();
    }
}
