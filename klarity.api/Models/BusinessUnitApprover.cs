namespace Klarity.Api.Models;

public class BusinessUnitApprover
{
    public string BusinessUnitId { get; set; } = string.Empty;
    public string ApproverId { get; set; } = string.Empty; // UserId of the approver
    public string? ApproverName { get; set; }
    public string? ApproverEmail { get; set; }
    public bool IsPrimary { get; set; } = true;
}
