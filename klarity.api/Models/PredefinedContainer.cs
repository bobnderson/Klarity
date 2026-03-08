using System.ComponentModel.DataAnnotations;

namespace Klarity.Api.Models;

public class PredefinedContainer
{
    public string ContainerId { get; set; } = string.Empty;

    [Required]
    public string Name { get; set; } = string.Empty;

    public string VesselId { get; set; } = string.Empty;

    public decimal Length { get; set; }
    public decimal Width { get; set; }
    public decimal Height { get; set; }

    [Required]
    public string DimensionUnit { get; set; } = "m";

    public decimal MaxWeight { get; set; }
    public string WeightUnit { get; set; } = "tonnes";

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
}
