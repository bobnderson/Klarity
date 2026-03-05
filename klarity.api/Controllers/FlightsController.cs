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
    private readonly IAuditService _auditService;

    public FlightsController(
        IFlightRepository repository,
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
    public async Task<ActionResult<Flight>> CreateFlight(Flight flight)
    {
        if (string.IsNullOrEmpty(flight.FlightId))
        {
            flight.FlightId = "flt-" + Guid.NewGuid().ToString("n").Substring(0, 8);
        }

        await _repository.CreateFlightAsync(flight);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Create Flight",
            true,
            "Flights",
            System.Text.Json.JsonSerializer.Serialize(flight)
        );

        return CreatedAtAction(nameof(GetFlight), new { id = flight.FlightId }, flight);
    }

    [HttpPut("{id}")]
    [ValidateModel]
    public async Task<IActionResult> UpdateFlight(string id, Flight flight)
    {
        if (id != flight.FlightId) return BadRequest("ID mismatch");

        await _repository.UpdateFlightAsync(flight);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Update Flight",
            true,
            "Flights",
            System.Text.Json.JsonSerializer.Serialize(flight)
        );

        return Ok(flight);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFlight(string id)
    {
        await _repository.DeleteFlightAsync(id);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Delete Flight",
            true,
            "Flights",
            $"Flight deleted: {id}"
        );

        return NoContent();
    }

    [HttpGet("{id}/manifest")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetManifest(string id)
    {
        var manifest = await _repository.GetFlightManifestAsync(id);
        return Ok(manifest);
    }

    [HttpPost("{id}/assign-items")]
    public async Task<IActionResult> AssignItems(string id, [FromBody] FlightAssignmentRequest request)
    {
        await _repository.AssignItemsToFlightAsync(id, request.ItemIds);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Assign Items to Flight",
            true,
            "Flights",
            $"Flight: {id}, Items: {string.Join(",", request.ItemIds)}"
        );

        return Ok(new { Success = true });
    }

    [HttpPost("{id}/unassign-items")]
    public async Task<IActionResult> UnassignItems(string id, [FromBody] FlightAssignmentRequest request)
    {
        await _repository.UnassignItemsFromFlightAsync(id, request.ItemIds);
        
        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Unassign Items from Flight",
            true,
            "Flights",
            $"Flight: {id}, Items: {string.Join(",", request.ItemIds)}"
        );

        return Ok(new { Success = true });
    }

    [HttpPost("optimize")]
    public async Task<ActionResult<IEnumerable<VoyageCandidate>>> Optimize()
    {
        var vessels = (await _vesselRepository.GetVesselsAsync(mode: "Aviation")).ToList();
        var requests = (await _requestRepository.GetUnscheduledMovementRequestsAsync(mode: "Aviation")).ToList();
        var locations = (await _locationRepository.GetLocationsAsync()).ToList();
        var existingVoyages = (await _repository.GetFlightsAsync()).ToList();

        // Note: IVoyageOptimizerService might still use Voyage internally, 
        // we might need to map or update it too if it causes issues.
        // For now, let's see if it compiles.
        
        // Mapping existing flights back to Voyage if optimizer needs it
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

        await _auditService.LogAsync(
            User.Identity?.Name ?? "Unknown",
            "Optimize Flights",
            true,
            "Flights",
            $"Generated {recommendations.Count} recommendations"
        );

        return Ok(recommendations);
    }

    public class FlightAssignmentRequest
    {
        public List<string> ItemIds { get; set; } = new();
    }
}

