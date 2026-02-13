using System.ComponentModel.DataAnnotations;

namespace Klarity.Api.Models;

public class Vessel
{
    public string VesselId { get; set; } = string.Empty;
    
    [Required]
    public string VesselName { get; set; } = string.Empty;
    
    public string? Owner { get; set; }
    public string? VesselTypeId { get; set; }
    public string? VesselTypeName { get; set; }
    public string? VesselCategoryId { get; set; }
    public string? StatusId { get; set; }

    public VesselParticulars Particulars { get; set; } = new();
    public VesselCapacities Capacities { get; set; } = new();
    public VesselPerformance Performance { get; set; } = new();
    public VesselFinancials Financials { get; set; } = new();
}

public class VesselParticulars
{
    public double? Loa { get; set; }
    public double? Lwl { get; set; }
    public double? BreadthMoulded { get; set; }
    public double? DepthMainDeck { get; set; }
    public double? DesignDraft { get; set; }
}

public class VesselCapacities
{
    public double? FuelOil { get; set; }
    public double? PotableWater { get; set; }
    public double? DrillWater { get; set; }
    public double? LiquidMud { get; set; }
    public double? DryBulkMud { get; set; }
    public double? DeadWeight { get; set; }
    public double? DeckArea { get; set; }
    public double? DeckLoading { get; set; }
    public int? TotalComplement { get; set; }
}

public class VesselPerformance
{
    public double? ServiceSpeed { get; set; }
    public double? MaxSpeed { get; set; }
}

public class VesselFinancials
{
    public double? HourlyOperatingCost { get; set; }
    public double? FuelConsumptionRate { get; set; }
    public double? MobilisationCost { get; set; }
}

public class VesselStatus
{
    public string StatusId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class VesselCategory
{
    public string CategoryId { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public List<VesselCategoryType> Types { get; set; } = new();
}

public class VesselCategoryType
{
    public string CategoryTypeId { get; set; } = string.Empty;
    public string CategoryType { get; set; } = string.Empty;
}
