using System.ComponentModel.DataAnnotations;

namespace Klarity.Api.Models;

public class User
{
    [Required]
    public string AccountId { get; set; } = string.Empty;

    [Required]
    public string AccountName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public DateTime? LastLogin { get; set; }
    public bool IsActive { get; set; } = true;
    public List<string> RoleIds { get; set; } = new();
}
