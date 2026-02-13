namespace Klarity.Api.Models;

public class AuditLog
{
    public int LogId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool IsSuccessful { get; set; }
    public DateTime Timestamp { get; set; }
    public string? RequestBody { get; set; }
    public string Controller { get; set; } = string.Empty;
    public string? Error { get; set; }
}
