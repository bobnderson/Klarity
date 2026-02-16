using System.ComponentModel.DataAnnotations;

namespace Klarity.Api.Models;

public class Helicopter
{
    [Key]
    public string HelicopterId { get; set; } = string.Empty;
    
    [Required]
    public string HelicopterName { get; set; } = string.Empty;
    
    public string? Owner { get; set; }
    public string? HelicopterTypeId { get; set; }
    public string? StatusId { get; set; }

    // Navigation helper
    public string? HelicopterTypeName { get; set; }
    public double? BasicOperatingWeightLb { get; set; }
    public double? MaxGrossWeightLb { get; set; }
    public double? AvailablePayloadLb { get; set; }
    public double? MaxFuelGal { get; set; }
    public double? MaxFuelLb { get; set; }

    // Technical Specifications
    public decimal? CruiseAirspeedKts { get; set; }
    public double? EnduranceHours { get; set; }
    public double? RangeNm { get; set; }
    public int? PassengerSeats { get; set; }

    // Navigation/Display helper (not in DB)
    public string? Status { get; set; }
}
