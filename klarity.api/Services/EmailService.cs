using System.Net;
using System.Net.Mail;
using Klarity.Api.Data;

namespace Klarity.Api.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, List<string>? cc = null);
        Task SendEmailWithAttachmentsAsync(string to, string subject, string body, List<string>? cc = null, List<Attachment>? attachments = null);
        Task SendTestEmailAsync(SmtpSettings settings, string to);
    }

    public class EmailService : IEmailService
    {
        private readonly ISettingsRepository _settingsRepository;
        private readonly IConfiguration _configuration;

        public EmailService(ISettingsRepository settingsRepository, IConfiguration configuration)
        {
            _settingsRepository = settingsRepository;
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body, List<string>? cc = null)
        {
            await SendEmailWithAttachmentsAsync(to, subject, body, cc, null);
        }

        public async Task SendEmailWithAttachmentsAsync(string to, string subject, string body, List<string>? cc = null, List<Attachment>? attachments = null)
        {
            var settings = await _settingsRepository.GetSmtpSettingsAsync();

            if (!settings.Enabled)
            {
                // Logging could be added here
                return;
            }

            if (string.IsNullOrEmpty(settings.Server))
            {
                throw new InvalidOperationException("SMTP Server is not configured.");
            }

            using var client = new SmtpClient(settings.Server, settings.Port);
            client.EnableSsl = settings.EnableSsl;
            
            if (!string.IsNullOrEmpty(settings.Username) && !string.IsNullOrEmpty(settings.Password))
            {
                client.Credentials = new NetworkCredential(settings.Username, settings.Password);
            }

            var activeFont = _configuration["FontSettings:ActiveFont"] ?? "Arial, sans-serif";
            var styledBody = $"<div style=\"font-family: {activeFont};\">{body}</div>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress(settings.SenderEmail),
                Subject = subject,
                Body = styledBody,
                IsBodyHtml = true
            };

            // Handle multiple recipients (split by ; or , if provided in 'to' string)
            foreach (var recipient in to.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                mailMessage.To.Add(recipient.Trim());
            }

            if (cc != null)
            {
                foreach (var ccAddress in cc)
                {
                    if (!string.IsNullOrWhiteSpace(ccAddress))
                    {
                        mailMessage.CC.Add(ccAddress.Trim());
                    }
                }
            }

            if (attachments != null)
            {
                foreach (var attachment in attachments)
                {
                    mailMessage.Attachments.Add(attachment);
                }
            }

            await client.SendMailAsync(mailMessage);
        }

        public async Task SendTestEmailAsync(SmtpSettings settings, string to)
        {
            if (string.IsNullOrEmpty(settings.Server))
            {
                throw new InvalidOperationException("SMTP Server is not configured.");
            }

            using var client = new SmtpClient(settings.Server, settings.Port);
            client.EnableSsl = settings.EnableSsl;
            
            if (!string.IsNullOrEmpty(settings.Username) && !string.IsNullOrEmpty(settings.Password))
            {
                client.Credentials = new NetworkCredential(settings.Username, settings.Password);
            }

            var activeFont = _configuration["FontSettings:ActiveFont"] ?? "Arial, sans-serif";
            var body = "<h3>SMTP Configuration Successful</h3><p>This is a test email from Klarity to verify SMTP settings.</p>";
            var styledBody = $"<div style=\"font-family: {activeFont};\">{body}</div>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress(settings.SenderEmail),
                Subject = "Klarity SMTP Configuration Test",
                Body = styledBody,
                IsBodyHtml = true
            };

            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
        }
    }
}
