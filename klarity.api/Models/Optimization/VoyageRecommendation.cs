using System;
using System.Collections.Generic;

namespace Klarity.Api.Models.Optimization
{
    public class RequestLoad
    {
        public string RequestId { get; set; } = string.Empty;
        public string OriginId { get; set; } = string.Empty;
        public string DestinationId { get; set; } = string.Empty;
        public DateTime EarliestDeparture { get; set; }
        public DateTime LatestDeparture { get; set; }
        public DateTime EarliestArrival { get; set; }
        public DateTime LatestArrival { get; set; }
        public double UrgencyScore { get; set; }
        public double TotalDeckArea { get; set; }
        public double TotalWeight { get; set; }
        public List<string> ItemIds { get; set; } = new();
        public int ItemCount { get; set; }
    }

    public class VoyageCandidate
    {
        public string? VoyageId { get; set; }
        public string VesselId { get; set; } = string.Empty;
        public string? VesselName { get; set; }
        public string OriginId { get; set; } = string.Empty;
        public string? OriginName { get; set; }
        public string DestinationId { get; set; } = string.Empty;
        public string? DestinationName { get; set; }
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public List<RequestLoad> AssignedLoads { get; set; } = new();
        public double TotalDeckUsed { get; set; }
        public double TotalWeightUsed { get; set; }
        public double TotalCost { get; set; }
        public double UtilisationPercent { get; set; }
        public double EstimatedSavings { get; set; }
        public int TotalItems { get; set; }
        public List<string> AggregatedItemIds { get; set; } = new();
        public List<string> AssignedRequestIds { get; set; } = new();
        public double Score { get; set; }
    }

    public class OptimizationRequest
    {
        public List<MovementRequest> Requests { get; set; } = new();
        public List<Vessel> Vessels { get; set; } = new();
        public List<Location> Locations { get; set; } = new();
        public List<Voyage> ExistingVoyages { get; set; } = new();
    }
}
