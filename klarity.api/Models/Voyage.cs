using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Klarity.Api.Models;

public class Voyage
{
    public string VoyageId { get; set; } = string.Empty;
    public string VesselId { get; set; } = string.Empty;
    public string? VesselName { get; set; }
    public string OriginId { get; set; } = string.Empty;
    public string? OriginName { get; set; }
    public string DestinationId { get; set; } = string.Empty;
    public string? DestinationName { get; set; }
    public string? ScheduleId { get; set; }
    public string? Origin => OriginName;
    public string? Destination => DestinationName;

    public DateTime DepartureDateTime { get; set; }
    public DateTime Eta { get; set; }
    public double WeightUtil { get; set; }
    public double DeckUtil { get; set; }
    public double CabinUtil { get; set; }
    public string? StatusId { get; set; }
    public string? StatusName { get; set; }
    
    public double CostPerPax { get; set; }
    public int PaxCapacity { get; set; }
    public int PaxCurrent { get; set; }
    
    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    public List<VoyageStop> Stops { get; set; } = new();
    public List<VoyageCargo> CargoDistribution { get; set; } = new();
}

public class VoyageStop
{
    public string StopId { get; set; } = string.Empty;
    public string VoyageId { get; set; } = string.Empty;
    public string LocationId { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public DateTime ArrivalDateTime { get; set; }
    public DateTime DepartureDateTime { get; set; }
    public string? StatusId { get; set; }
    public string? StatusName { get; set; }
}

public class VoyageStatus
{
    public string StatusId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public class VoyageCargo
{
    public string Type { get; set; } = string.Empty;
    public double Value { get; set; }
}
