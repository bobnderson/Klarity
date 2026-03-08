using Klarity.Api.Utils;
using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Models;
using Klarity.Api.Data;
using Klarity.Api.Attributes;
using Klarity.Api.Services;
using System.Text.RegularExpressions;

namespace Klarity.Api.Controllers;

[TokenAuthorize]
[ApiController]
[Route("api/[controller]")]
public class MovementRequestsController : ControllerBase
{
    private readonly IMovementRequestRepository _repository;
    private readonly IAuditService _auditService;
    private readonly IEmailService _emailService;
    private readonly INotificationRepository _notificationRepository;
    private readonly IVoyageRepository _voyageRepository;
    private readonly IManifestExportService _manifestExportService;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    private readonly Utils.Security _security;

    public MovementRequestsController(
        IMovementRequestRepository repository, 
        IEmailService emailService,
        INotificationRepository notificationRepository,
        IVoyageRepository voyageRepository,
        IManifestExportService manifestExportService,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        Utils.Security security)
    {
        _repository = repository;
        _emailService = emailService;
        _notificationRepository = notificationRepository;
        _voyageRepository = voyageRepository;
        _manifestExportService = manifestExportService;
        _configuration = configuration;
        _security = security;
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
        return Ok(new PaginatedResponse<MovementRequest> { Items = result.Items, TotalCount = result.TotalCount });
    }

    [HttpGet("account/{accountId}/search")]
    public async Task<ActionResult> SearchMovementRequestsByAccount(string accountId, [FromQuery] string query, [FromQuery] string mode = "Marine")
    {
        var result = await _repository.SearchMovementRequestsByAccountAsync(accountId, query, mode);
        return Ok(new PaginatedResponse<MovementRequest> { Items = result, TotalCount = result.Count() });
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

    [HttpGet("approvers/mapping")]
    public async Task<ActionResult<IEnumerable<BusinessUnitApprover>>> GetApproversMapping()
    {
        var mapping = await _repository.GetApproversMappingAsync();
        return Ok(mapping);
    }

    [HttpGet("pending-approval")]
    public async Task<ActionResult<IEnumerable<MovementRequest>>> GetPendingApprovals([FromQuery] string mode = "Marine")
    {
        var approverId = _security.GetAccountIdFromRequest(Request);
        var requests = await _repository.GetPendingApprovalsAsync(approverId, mode);
        return Ok(requests);
    }

    [HttpPost]
    [ValidateModel]
    [Audit("Create Movement Request")]
    public async Task<ActionResult<MovementRequest>> CreateMovementRequest(MovementRequest request, [FromQuery] string mode = "Marine")
    {
        try
        {
            await _repository.CreateMovementRequestAsync(request, mode);

            var created = await _repository.GetMovementRequestByIdAsync(request.RequestId, mode);
            
            if (mode == "Aviation" && !string.IsNullOrEmpty(request.BusinessUnitId))
            {
                await SendAviationApprovalNotificationAsync(request, created);
            }

            return CreatedAtAction(nameof(GetMovementRequest), new { id = request.RequestId, mode }, created ?? request);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating movement request: {ex}");
            return StatusCode(500, "Internal server error: " + ex.Message);
        }
    }

    [HttpPut("{id}")]
    [ValidateModel]
    [Audit("Update Movement Request")]
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

            var updated = await _repository.GetMovementRequestByIdAsync(id, mode);

            return Ok(updated ?? request);
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Internal server error: " + ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Audit("Delete Movement Request")]
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
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, "Internal server error: " + ex.Message);
        }
    }

    [HttpPost("{id}/approve")]
    [Audit("Approve Request")]
    public async Task<IActionResult> ApproveRequest(string id, [FromBody] string comments, [FromQuery] string mode = "Marine")
    {
        var request = await _repository.GetMovementRequestByIdAsync(id, mode);
        if (request == null) return NotFound();

        var approverId = _security.GetAccountIdFromRequest(Request);
        var success = await _repository.ApproveRequestAsync(id, approverId, comments, mode);
        if (!success) return NotFound();
        
        await SendRequestApprovedNotificationAsync(request, comments, mode);
        return Ok();
    }

    [HttpPost("{id}/reject")]
    [Audit("Reject Request")]
    public async Task<IActionResult> RejectRequest(string id, [FromBody] string comments, [FromQuery] string mode = "Marine")
    {
        var approverId = _security.GetAccountIdFromRequest(Request);
        var success = await _repository.RejectRequestAsync(id, approverId, comments, mode);
        if (!success) return NotFound();

        return Ok();
    }

    private async Task SendAviationApprovalNotificationAsync(MovementRequest request, MovementRequest? created)
    {
        var approver = await _repository.GetApproverForBusinessUnitAsync(request.BusinessUnitId);
        if (approver != null && !string.IsNullOrEmpty(approver.ApproverEmail))
        {
            var appBaseUrl = _configuration["AppBaseUrl"];
            var deepLink = $"{appBaseUrl}/aviation-approval/{request.RequestId}";

            var template = await _notificationRepository.GetTemplateByIdAsync("aviation-approval");
            if (template == null)
            {
                throw new InvalidOperationException("Aviation approval email template not found in database.");
            }

            var subject = template.Subject
                .Replace("{RequestId}", request.RequestId);

            var fullHtml = template.BodyHtml
                .Replace("{RequestId}", request.RequestId)
                .Replace("{OriginName}", created?.OriginName ?? "Unknown")
                .Replace("{DestinationName}", created?.DestinationName ?? "Unknown")
                .Replace("{RequestedBy}", request.RequestedBy)
                .Replace("{DeepLink}", deepLink);

            await _emailService.SendEmailAsync(approver.ApproverEmail, subject, fullHtml);
        }
    }

    private async Task SendRequestApprovedNotificationAsync(MovementRequest request, string comments, string mode)
    {
        
        var emailsToNotify = new HashSet<string>();
        if (!string.IsNullOrEmpty(request.RequestedBy))
        {
            emailsToNotify.Add(request.RequestedBy);
        }
        
        if (request.Notify != null)
        {
            foreach (var email in request.Notify)
            {
                if (!string.IsNullOrEmpty(email)) emailsToNotify.Add(email);
            }
        }

        if (emailsToNotify.Count > 0)
        {
            var appBaseUrl = _configuration["AppBaseUrl"];
            var summaryLink = $"{appBaseUrl}/{(mode == "Aviation" ? "aviation" : "marine")}-request";
            var voyageInfo = !string.IsNullOrEmpty(request.SelectedVoyageId) 
                ? $"<p><strong>Assigned Voyage:</strong> {request.SelectedVoyageId}</p>" 
                : "";
                
            var htmlBody = $@"
                <h2>Movement Request Approved</h2>
                <p>Your movement request <strong>{request.RequestId}</strong> has been approved.</p>
                {voyageInfo}
                <p><strong>Approver Comments:</strong> {comments}</p>
                <p><a href='{summaryLink}'>View Requests Dashboard</a></p>
            ";

            foreach (var email in emailsToNotify)
            {
                await _emailService.SendEmailAsync(email, $"Klarity Tracker: Request {request.RequestId} Approved", htmlBody);
            }
        }
    }

    [HttpGet("{id}/manifest/download")]
    public async Task<IActionResult> DownloadManifest(string id, [FromQuery] string mode = "Marine")
    {
        try
        {
            var request = await _repository.GetMovementRequestByIdAsync(id, mode);
            if (request == null) return NotFound("Movement request not found");

            var manifest = new List<MovementRequest> { request };
            
            var identifier = request.RequestId;
            var vesselName = "N/A";
            var route = $"{request.OriginName ?? request.OriginId} to {request.DestinationName ?? request.DestinationId}";
            var departure = request.EarliestDeparture.ToString("dd MMM yyyy");
            var arrival = request.LatestArrival.ToString("dd MMM yyyy");

            if (!string.IsNullOrEmpty(request.SelectedVoyageId))
            {
                var voyage = await _voyageRepository.GetVoyageByIdAsync(request.SelectedVoyageId);
                if (voyage != null)
                {
                    vesselName = voyage.VesselName ?? voyage.VesselId;
                    route = $"{voyage.OriginName ?? voyage.OriginId} to {voyage.DestinationName ?? voyage.DestinationId}";
                    departure = voyage.DepartureDateTime.ToString("dd MMM yyyy HH:mm");
                    arrival = voyage.Eta.ToString("dd MMM yyyy HH:mm");
                }
            }

            var pdfBytes = _manifestExportService.GenerateManifestPdf(new ManifestExportData
            {
                Identifier = identifier,
                VesselName = vesselName,
                Route = route,
                Departure = departure,
                Arrival = arrival,
                WeightUtil = request.TotalWeight,
                DeckUtil = request.TotalDeckArea,
                Manifest = manifest,
                IsAviation = mode.Equals("Aviation", StringComparison.OrdinalIgnoreCase),
                Status = request.Status
            });

            return File(pdfBytes, "application/pdf", $"Manifest_{request.RequestId}.pdf");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error generating PDF: {ex.Message}");
        }
    }
}
