using Klarity.Api.Utils;
using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Models;
using Klarity.Api.Models.Aviation;
using Klarity.Api.Data;
using Klarity.Api.Attributes;
using Klarity.Api.Services;
using Klarity.Api.Services.Optimization;
using Klarity.Api.Models.Optimization;

namespace Klarity.Api.Controllers;

[TokenAuthorize]
[ApiController]
[Route("api/[controller]")]
public class FlightsController : ControllerBase
{
    private readonly IFlightRepository _repository;
    private readonly IVesselRepository _vesselRepository;
    private readonly IMovementRequestRepository _requestRepository;
    private readonly ILocationRepository _locationRepository;
    private readonly IVoyageOptimizerService _optimizerService;
    private readonly IManifestExportService _manifestExportService;

    public FlightsController(
        IFlightRepository repository,
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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Flight>>> GetFlights()
    {
        var flights = await _repository.GetFlightsAsync();
        return Ok(flights);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Flight>> GetFlight(string id)
    {
        var flight = await _repository.GetFlightByIdAsync(id);
        if (flight == null) return NotFound();
        return Ok(flight);
    }

    [HttpGet("date-range")]
    public async Task<ActionResult<IEnumerable<Flight>>> GetFlightsByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        var flights = await _repository.GetFlightsByDateRangeAsync(startDate, endDate);
        return Ok(flights);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Flight>>> SearchFlights(
        [FromQuery] string originId, 
        [FromQuery] string destinationId, 
        [FromQuery] DateTime travelDate, 
        [FromQuery] int paxCount = 1)
    {
        if (string.IsNullOrEmpty(originId) || string.IsNullOrEmpty(destinationId))
        {
            return BadRequest("Origin and Destination are required.");
        }

        var flights = await _repository.SearchFlightsAsync(originId, destinationId, travelDate, paxCount);
        return Ok(flights);
    }

    [HttpPost]
    [ValidateModel]
    [Audit("Create Flight")]
    public async Task<ActionResult<Flight>> CreateFlight(Flight flight)
    {
        if (string.IsNullOrEmpty(flight.FlightId))
        {
            flight.FlightId = "flt-" + Guid.NewGuid().ToString("n").Substring(0, 8);
        }

        await _repository.CreateFlightAsync(flight);
        return CreatedAtAction(nameof(GetFlight), new { id = flight.FlightId }, flight);
    }

    [HttpPut("{id}")]
    [ValidateModel]
    [Audit("Update Flight")]
    public async Task<IActionResult> UpdateFlight(string id, Flight flight)
    {
        if (id != flight.FlightId) return BadRequest("ID mismatch");

        await _repository.UpdateFlightAsync(flight);
        return Ok(flight);
    }

    [HttpDelete("{id}")]
    [Audit("Delete Flight")]
    public async Task<IActionResult> DeleteFlight(string id)
    {
        await _repository.DeleteFlightAsync(id);
        return NoContent();
    }

    [HttpGet("{id}/manifest")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetManifest(string id)
    {
        var manifest = await _repository.GetFlightManifestAsync(id);
        return Ok(manifest);
    }

    [HttpGet("{id}/manifest/download")]
    public async Task<IActionResult> DownloadManifest(string id)
    {
        try
        {
            var flight = await _repository.GetFlightByIdAsync(id);
            if (flight == null) return NotFound("Flight not found");

            var vessel = await _vesselRepository.GetVesselByIdAsync(flight.HelicopterId);
            var manifest = await _repository.GetFlightManifestAsync(id);

            var pdfBytes = _manifestExportService.GenerateManifestPdf(new ManifestExportData
            {
                Identifier = flight.FlightId,
                VesselName = vessel?.VesselName ?? flight.HelicopterId,
                Route = $"{flight.OriginName ?? flight.OriginId} to {flight.DestinationName ?? flight.DestinationId}",
                Departure = flight.DepartureDateTime.ToString("dd MMM yyyy HH:mm"),
                Arrival = flight.ArrivalDateTime.ToString("dd MMM yyyy HH:mm"),
                WeightUtil = flight.PayloadUtil,
                DeckUtil = flight.CabinUtil,
                Manifest = manifest,
                IsAviation = true,
                Status = flight.StatusId ?? "scheduled"
            });

            return File(pdfBytes, "application/pdf", $"Manifest_{vessel?.VesselName ?? "Aircraft"}_{id}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error generating PDF: {ex.Message}");
        }
    }

    [HttpPost("{id}/assign-items")]
    [Audit("Assign Items to Flight")]
    public async Task<IActionResult> AssignItems(string id, [FromBody] FlightAssignmentRequest request)
    {
        await _repository.AssignItemsToFlightAsync(id, request.ItemIds);
        return Ok(new { Success = true });
    }

    [HttpPost("{id}/unassign-items")]
    [Audit("Unassign Items from Flight")]
    public async Task<IActionResult> UnassignItems(string id, [FromBody] FlightAssignmentRequest request)
    {
        await _repository.UnassignItemsFromFlightAsync(id, request.ItemIds);
        return Ok(new { Success = true });
    }

    [HttpPost("optimize")]
    [Audit("Optimize Flights")]
    public async Task<ActionResult<IEnumerable<VoyageCandidate>>> Optimize()
    {
        var vessels = (await _vesselRepository.GetVesselsAsync(mode: "Aviation")).ToList();
        var requests = (await _requestRepository.GetUnscheduledMovementRequestsAsync(mode: "Aviation")).ToList();
        var locations = (await _locationRepository.GetLocationsAsync()).ToList();
        var existingVoyages = (await _repository.GetFlightsAsync()).ToList();
        
        var voyages = existingVoyages.Select(f => new Voyage {
            VoyageId = f.FlightId,
            VesselId = f.HelicopterId,
            OriginId = f.OriginId,
            DestinationId = f.DestinationId,
            DepartureDateTime = f.DepartureDateTime,
            Eta = f.ArrivalDateTime,
            PaxCapacity = f.PaxCapacity,
            PaxCurrent = f.PaxCurrent
        }).ToList();

        var recommendations = _optimizerService.OptimiseVoyagePlan(
            requests,
            vessels,
            locations,
            voyages
        );

        return Ok(recommendations);
    }

    public class FlightAssignmentRequest
    {
        public List<string> ItemIds { get; set; } = new();
    }
}

