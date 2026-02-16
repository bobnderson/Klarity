using System.ComponentModel.DataAnnotations.Schema;

namespace Klarity.Api.Models.Aviation;

public class Flight
{
    public string FlightId { get; set; } = string.Empty;
    public string HelicopterId { get; set; } = string.Empty;
    public string? HelicopterName { get; set; }
    public string OriginId { get; set; } = string.Empty;
    public string? OriginName { get; set; }
    public string DestinationId { get; set; } = string.Empty;
    public string? DestinationName { get; set; }

    public DateTime DepartureDateTime { get; set; }
    public DateTime ArrivalDateTime { get; set; } // eta renamed
    
    public double PayloadUtil { get; set; } // weightUtil renamed
    public double CabinUtil { get; set; }
    
    public string? StatusId { get; set; }
    public string? StatusName { get; set; }
    
    public double CostPerPax { get; set; }
    public int PaxCapacity { get; set; }
    public int PaxCurrent { get; set; }
    
    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    public List<FlightStop> Stops { get; set; } = new();
    public List<FlightCargoDistribution> CargoDistribution { get; set; } = new();
}

public class FlightStop
{
    public string StopId { get; set; } = string.Empty;
    public string FlightId { get; set; } = string.Empty;
    public string LocationId { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public DateTime ArrivalDateTime { get; set; }
    public DateTime DepartureDateTime { get; set; }
    public string? StatusId { get; set; }
    public string? StatusName { get; set; }
}

public class FlightCargoDistribution
{
    public string Type { get; set; } = string.Empty;
    public double Value { get; set; }
}
