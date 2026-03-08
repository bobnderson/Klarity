using System.ComponentModel.DataAnnotations;

namespace Klarity.Api.Models;

public class MovementRequest
{
    public string RequestId { get; set; } = string.Empty;
    public DateTime? RequestDate { get; set; }
    
    [Required]
    public string Status { get; set; } = "Draft";
    
    [Required]
    public string ScheduleIndicator { get; set; } = "Unscheduled";
    
    [Required]
    public string OriginId { get; set; } = string.Empty;
    
    [Required]
    public string DestinationId { get; set; } = string.Empty;

    public string? OriginName { get; set; }
    public string? DestinationName { get; set; }
    
    [Required]
    public DateTime EarliestDeparture { get; set; }
    public DateTime? LatestDeparture { get; set; }
    public DateTime? EarliestArrival { get; set; }
    
    public string? ReturnEarliestDeparture { get; set; }
    public string? ReturnLatestArrival { get; set; }
    
    [Required]
    public DateTime LatestArrival { get; set; }
    
    public string? RequestedBy { get; set; }
    
    [Required]
    public string UrgencyId { get; set; } = "routine-operations";
    public string? Urgency { get; set; }
    
    public bool IsHazardous { get; set; }
    
    public string? RequestTypeId { get; set; }
    
    public bool TransportationRequired { get; set; } = true;
    public string? Lifting { get; set; }
    
    public string? BusinessUnitId { get; set; }
    public string? BusinessUnitName { get; set; }
    
    public string? CostCentre { get; set; }
    
    public string? Comments { get; set; }
    public List<string>? Notify { get; set; }
    
    
    public double TotalDeckArea { get; set; }
    public double TotalWeight { get; set; }
    
    public bool IsDeleted { get; set; }
    
    public string TripType { get; set; } = "OneWay";
    public string? SelectedVoyageId { get; set; }
    public string? ReturnVoyageId { get; set; }
    
    public string? ApproverId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApproverComments { get; set; }
    
    // Scheduled Flight Times
    public DateTime? ScheduledDeparture { get; set; }
    public DateTime? ScheduledArrival { get; set; }
    public DateTime? ReturnScheduledDeparture { get; set; }
    public DateTime? ReturnScheduledArrival { get; set; }
    public string? VesselName { get; set; }
    public string TransportationMode { get; set; } = "Marine";

    public List<MovementRequestItem> Items { get; set; } = new();
}

public class UrgencyOption
{
    public string UrgencyId { get; set; } = string.Empty;
    public string UrgencyLabel { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class UnitOfMeasurementOption
{
    public string UnitId { get; set; } = string.Empty;
    public string UnitLabel { get; set; } = string.Empty;
}

public class DimensionUnitOption
{
    public string UnitId { get; set; } = string.Empty;
    public string UnitLabel { get; set; } = string.Empty;
}

public class WeightUnitOption
{
    public string UnitId { get; set; } = string.Empty;
    public string UnitLabel { get; set; } = string.Empty;
}

public class RequestTypeOption
{
    public string RequestTypeId { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty;
}

public class BusinessUnitOption
{
    public string BusinessUnitId { get; set; } = string.Empty;
    public string BusinessUnit { get; set; } = string.Empty;
    public List<CostCentreOption> CostCentres { get; set; } = new();
}

public class ItemCategoryOption
{
    public string CategoryId { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
}

public class ItemTypeOption
{
    public string TypeId { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;
}

public class CostCentreOption
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class MovementRequestItem
{
    public string ItemId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    
    [Required]
    public string CategoryId { get; set; } = string.Empty;
    
    [Required]
    public string ItemTypeId { get; set; } = string.Empty;
    
    [Required]
    public double Quantity { get; set; }
    
    [Required]
    public string UnitOfMeasurement { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    public string? Dimensions { get; set; }
    public string? DimensionUnit { get; set; }
    public double? Volume { get; set; }
    public double? Weight { get; set; }
    public string? WeightUnit { get; set; }
    public string? AssignedVoyageId { get; set; }
    public string? Status { get; set; }
    public bool IsHazardous { get; set; }
    public string? ItemTypeName { get; set; }
    public string? ContainerId { get; set; }
}
