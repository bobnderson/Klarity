using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Models;
using Klarity.Api.Data;
using Klarity.Api.Attributes;
using Klarity.Api.Services;

namespace Klarity.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MovementRequestsController : ControllerBase
{
    private readonly IMovementRequestRepository _repository;
    private readonly IAuditService _auditService;

    public MovementRequestsController(IMovementRequestRepository repository, IAuditService auditService)
    {
        _repository = repository;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetMovementRequests()
    {
        var requests = await _repository.GetMovementRequestsAsync();
        return Ok(requests);
    }

    [HttpGet("account/{accountId}")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetMovementRequestsByAccount(string accountId)
    {
        var requests = await _repository.GetMovementRequestsByAccountAsync(accountId);
        return Ok(requests);
    }

    [HttpGet("unscheduled")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetUnscheduledMovementRequests([FromQuery] string? originId = null, [FromQuery] string? destinationId = null)
    {
        var requests = await _repository.GetUnscheduledMovementRequestsAsync(originId, destinationId);
        return Ok(requests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MovementRequest>> GetMovementRequest(string id)
    {
        var request = await _repository.GetMovementRequestByIdAsync(id);
        if (request == null)
        {
            return NotFound();
        }
        return Ok(request);
    }

    [HttpGet("urgencies")]
    public async Task<ActionResult<IEnumerable<UrgencyOption>>> GetUrgencies()
    {
        var urgencies = await _repository.GetUrgenciesAsync();
        return Ok(urgencies);
    }

    [HttpGet("units")]
    public async Task<ActionResult<IEnumerable<UnitOfMeasurementOption>>> GetUnits()
    {
        var units = await _repository.GetUnitsOfMeasurementAsync();
        return Ok(units);
    }

    [HttpGet("dimension-units")]
    public async Task<ActionResult<IEnumerable<DimensionUnitOption>>> GetDimensionUnits()
    {
        var units = await _repository.GetDimensionUnitsAsync();
        return Ok(units);
    }

    [HttpGet("weight-units")]
    public async Task<ActionResult<IEnumerable<WeightUnitOption>>> GetWeightUnits()
    {
        var units = await _repository.GetWeightUnitsAsync();
        return Ok(units);
    }

    [HttpGet("request-types")]
    public async Task<ActionResult<IEnumerable<RequestTypeOption>>> GetRequestTypes()
    {
        var types = await _repository.GetRequestTypesAsync();
        return Ok(types);
    }

    [HttpGet("business-units")]
    public async Task<ActionResult<IEnumerable<BusinessUnitOption>>> GetBusinessUnits()
    {
        var units = await _repository.GetBusinessUnitsAsync();
        return Ok(units);
    }

    [HttpGet("item-categories")]
    public async Task<ActionResult<IEnumerable<ItemCategoryOption>>> GetItemCategories()
    {
        var categories = await _repository.GetItemCategoriesAsync();
        return Ok(categories);
    }

    [HttpGet("item-types")]
    public async Task<ActionResult<IEnumerable<ItemTypeOption>>> GetItemTypes()
    {
        var types = await _repository.GetItemTypesAsync();
        return Ok(types);
    }

    [HttpPost]
    [ValidateModel]
    public async Task<ActionResult<MovementRequest>> CreateMovementRequest(MovementRequest request)
    {
        try
        {
            await _repository.CreateMovementRequestAsync(request);

            // Fetch the fully populated object (with location names) to return
            var created = await _repository.GetMovementRequestByIdAsync(request.RequestId);
            
            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Create Movement Request",
                true,
                "MovementRequests",
                System.Text.Json.JsonSerializer.Serialize(created ?? request)
            );

            return CreatedAtAction(nameof(GetMovementRequest), new { id = request.RequestId }, created ?? request);
        }
        catch (Exception ex)
        {
            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Create Movement Request",
                false,
                "MovementRequests",
                System.Text.Json.JsonSerializer.Serialize(request),
                ex.Message
            );
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPut("{id}")]
    [ValidateModel]
    public async Task<IActionResult> UpdateMovementRequest(string id, MovementRequest request)
    {
        if (id != request.RequestId)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            var existing = await _repository.GetMovementRequestByIdAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            await _repository.UpdateMovementRequestAsync(request);

            // Fetch the fully populated object (with location names) to return
            var updated = await _repository.GetMovementRequestByIdAsync(id);

            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Update Movement Request",
                true,
                "MovementRequests",
                System.Text.Json.JsonSerializer.Serialize(updated ?? request)
            );

            return Ok(updated ?? request);
        }
        catch (Exception ex)
        {
            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Update Movement Request",
                false,
                "MovementRequests",
                System.Text.Json.JsonSerializer.Serialize(request),
                ex.Message
            );
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMovementRequest(string id)
    {
        try
        {
            var existing = await _repository.GetMovementRequestByIdAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            await _repository.DeleteMovementRequestAsync(id);

            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Delete Movement Request",
                true,
                "MovementRequests",
                id
            );

            return NoContent();
        }
        catch (Exception ex)
        {
            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Delete Movement Request",
                false,
                "MovementRequests",
                id,
                ex.Message
            );
            return StatusCode(500, "Internal server error");
        }
    }
}
