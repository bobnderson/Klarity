using Klarity.Api.Data;
using Klarity.Api.Utils;
using Microsoft.AspNetCore.Mvc;
using Klarity.Api.Attributes;

namespace Klarity.Api.Controllers
{
    [TokenAuthorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsRepository _settingsRepository;
        private readonly Services.IEmailService _emailService;
        private readonly Services.IAuditService _auditService;
        private readonly Utils.Security _security;

        public SettingsController(
            ISettingsRepository settingsRepository, 
            Services.IEmailService emailService,
            Services.IAuditService auditService,
            Utils.Security security)
        {
            _settingsRepository = settingsRepository;
            _emailService = emailService;
            _auditService = auditService;
            _security = security;
        }

        [HttpGet("smtp")]
        public async Task<IActionResult> GetSmtpSettings()
        {
            var settings = await _settingsRepository.GetSmtpSettingsAsync();
            
            if (!string.IsNullOrEmpty(settings.Password))
            {
                settings.Password = "********";
            }
            
            return Ok(settings);
        }

        [HttpPost("smtp")]
        [Audit("Update SMTP Settings")]
        public async Task<IActionResult> SaveSmtpSettings([FromBody] SmtpSettings settings)
        {
            if (settings.Password == "********")
            {
                var existing = await _settingsRepository.GetSmtpSettingsAsync();
                settings.Password = existing.Password;
            }

            var userId = _security.GetAccountIdFromRequest(Request);
            await _settingsRepository.SaveSmtpSettingsAsync(settings, userId);

            return Ok(new { message = "SMTP settings saved successfully" });
        }
        
        [HttpPost("smtp/test")]
        public async Task<IActionResult> TestSmtpSettings([FromBody] TestSmtpRequest request)
        {
            if (request.Settings == null || string.IsNullOrEmpty(request.ToEmail))
            {
                return BadRequest("Settings and target email are required.");
            }

            // If password is masked, retrieve existing password to keep it unchanged
            if (request.Settings.Password == "********")
            {
                var existing = await _settingsRepository.GetSmtpSettingsAsync();
                request.Settings.Password = existing.Password;
            }

            try
            {
                await _emailService.SendTestEmailAsync(request.Settings, request.ToEmail);
                return Ok(new { message = "Test email sent successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to send test email: {ex.Message}");
            }
        }
    }

    public class TestSmtpRequest
    {
        public SmtpSettings Settings { get; set; }
        public string ToEmail { get; set; }
    }
}
