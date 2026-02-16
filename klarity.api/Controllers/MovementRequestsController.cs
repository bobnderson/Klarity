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
    private readonly IEmailService _emailService;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public MovementRequestsController(
        IMovementRequestRepository repository, 
        IAuditService auditService, 
        IEmailService emailService,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _repository = repository;
        _auditService = auditService;
        _emailService = emailService;
        _configuration = configuration;
    }



    [HttpGet]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetMovementRequests([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] string mode = "Marine")
    {
        var requests = await _repository.GetMovementRequestsAsync(startDate, endDate, mode);
        return Ok(requests);
    }

    [HttpGet("account/{accountId}")]
    public async Task<ActionResult> GetMovementRequestsByAccount(string accountId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string mode = "Marine", [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _repository.GetMovementRequestsByAccountAsync(accountId, page, pageSize, mode, startDate, endDate);
        return Ok(new { items = result.Items, totalCount = result.TotalCount });
    }

    [HttpGet("unscheduled")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetUnscheduledMovementRequests([FromQuery] string? originId = null, [FromQuery] string? destinationId = null, [FromQuery] string mode = "Marine")
    {
        var requests = await _repository.GetUnscheduledMovementRequestsAsync(originId, destinationId, mode);
        return Ok(requests);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MovementRequest>> GetMovementRequest(string id, [FromQuery] string mode = "Marine")
    {
        var request = await _repository.GetMovementRequestByIdAsync(id, mode);
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
    public async Task<ActionResult<IEnumerable<RequestTypeOption>>> GetRequestTypes([FromQuery] string mode = "Marine")
    {
        var types = await _repository.GetRequestTypesAsync(mode);
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
    public async Task<ActionResult<MovementRequest>> CreateMovementRequest(MovementRequest request, [FromQuery] string mode = "Marine")
    {
        try
        {
            await _repository.CreateMovementRequestAsync(request, mode);

            var created = await _repository.GetMovementRequestByIdAsync(request.RequestId, mode);
            
            // Check if aviation and send notification to approver
            if (mode == "Aviation" && !string.IsNullOrEmpty(request.BusinessUnitId))
            {
                var approver = await _repository.GetApproverForBusinessUnitAsync(request.BusinessUnitId);
                if (approver != null && !string.IsNullOrEmpty(approver.ApproverEmail))
                {
                    var appBaseUrl = _configuration["AppBaseUrl"] ?? "http://localhost:5173";
                    var deepLink = $"{appBaseUrl}/aviation-approval/{request.RequestId}";
                    
                    var subject = $"Klarity Aviation: Approval Required for Request {request.RequestId}";
                    var body = $@"
                        <h2>Aviation Request Approval Required</h2>
                        <p>A new aviation request <strong>{request.RequestId}</strong> has been submitted and requires your approval.</p>
                        <p><strong>Route:</strong> {created?.OriginName} to {created?.DestinationName}</p>
                        <p><strong>Requested By:</strong> {request.RequestedBy}</p>
                        <p>Please click the link below to review and approve the request:</p>
                        <p><a href='{deepLink}'>{deepLink}</a></p>
                    ";
                    
                    await _emailService.SendEmailAsync(approver.ApproverEmail, subject, body);
                }
            }

            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Create Movement Request",
                true,
                "MovementRequests",
                System.Text.Json.JsonSerializer.Serialize(created ?? request)
            );

            return CreatedAtAction(nameof(GetMovementRequest), new { id = request.RequestId, mode }, created ?? request);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating movement request: {ex}");
            await _auditService.LogAsync(
                User.Identity?.Name ?? "Unknown",
                "Create Movement Request",
                false,
                "MovementRequests",
                System.Text.Json.JsonSerializer.Serialize(request),
                ex.Message
            );
            return StatusCode(500, "Internal server error: " + ex.Message);
        }
    }

    [HttpPut("{id}")]
    [ValidateModel]
    public async Task<IActionResult> UpdateMovementRequest(string id, [FromBody] MovementRequest request, [FromQuery] string mode = "Marine")
    {
        if (id != request.RequestId)
        {
            return BadRequest("ID mismatch");
        }

        try
        {
            var existing = await _repository.GetMovementRequestByIdAsync(id, mode);
            if (existing == null)
            {
                return NotFound();
            }

            await _repository.UpdateMovementRequestAsync(request, mode);

            // Fetch the fully populated object (with location names) to return
            var updated = await _repository.GetMovementRequestByIdAsync(id, mode);

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
    public async Task<IActionResult> DeleteMovementRequest(string id, [FromQuery] string mode = "Marine")
    {
        try
        {
            var existing = await _repository.GetMovementRequestByIdAsync(id, mode);
            if (existing == null)
            {
                return NotFound();
            }

            await _repository.DeleteMovementRequestAsync(id, mode);

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

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveRequest(string id, [FromBody] string comments, [FromQuery] string mode = "Marine")
    {
        var success = await _repository.ApproveRequestAsync(id, User.Identity?.Name ?? "Unknown", comments, mode);
        if (!success) return NotFound();
        
        await _auditService.LogAsync(User.Identity?.Name ?? "Unknown", "Approve Request", true, "MovementRequests", id);
        return Ok();
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectRequest(string id, [FromBody] string comments, [FromQuery] string mode = "Marine")
    {
        var success = await _repository.RejectRequestAsync(id, User.Identity?.Name ?? "Unknown", comments, mode);
        if (!success) return NotFound();

        await _auditService.LogAsync(User.Identity?.Name ?? "Unknown", "Reject Request", true, "MovementRequests", id);
        return Ok();
    }
}
