using Klarity.Api.Data;
using Klarity.Api.Models;
using Klarity.Api.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Klarity.Api.Controllers;

[TokenAuthorize]
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationRepository _notificationRepository;
    private readonly Services.IAuditService _auditService;
    private readonly Utils.Security _security;

    public NotificationsController(
        INotificationRepository notificationRepository,
        Services.IAuditService auditService,
        Utils.Security security)
    {
        _notificationRepository = notificationRepository;
        _auditService = auditService;
        _security = security;
    }

    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _notificationRepository.GetTemplatesAsync();
        return Ok(templates);
    }

    [HttpGet("templates/{templateId}")]
    public async Task<IActionResult> GetTemplate(string templateId)
    {
        var template = await _notificationRepository.GetTemplateByIdAsync(templateId);
        if (template == null) return NotFound();
        return Ok(template);
    }

    [HttpPut("templates/{templateId}")]
    public async Task<IActionResult> UpdateTemplate(string templateId, [FromBody] NotificationTemplate template)
    {
        if (templateId != template.TemplateId)
        {
            return BadRequest("ID mismatch");
        }

        var existing = await _notificationRepository.GetTemplateByIdAsync(templateId);
        if (existing == null) return NotFound();

        await _notificationRepository.UpdateTemplateAsync(template);

        var accountId = _security.GetAccountIdFromRequest(Request);
        await _auditService.LogAsync(accountId, "UpdateNotificationTemplate", true, "Settings", templateId);

        return Ok(template);
    }
}
