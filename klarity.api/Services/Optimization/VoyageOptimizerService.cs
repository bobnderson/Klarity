using System;
using System.Collections.Generic;
using System.Linq;
using Klarity.Api.Models;
using Klarity.Api.Models.Optimization;
using Klarity.Api.Utils;

namespace Klarity.Api.Services.Optimization
{
    public interface IVoyageOptimizerService
    {
        List<VoyageCandidate> OptimiseVoyagePlan(
            List<MovementRequest> requests,
            List<Vessel> vessels,
            List<Location> locations,
            List<Voyage> existingVoyages);
    }

    public class VoyageOptimizerService : IVoyageOptimizerService
    {
        private const double RadiusOfEarthKm = 6371.0;

        public List<VoyageCandidate> OptimiseVoyagePlan(
            List<MovementRequest> requests,
            List<Vessel> vessels,
            List<Location> locations,
            List<Voyage> existingVoyages)
        {
            var loads = BuildRequestLoads(requests);
            var activeVessels = vessels.Where(v => 
                v.StatusId == "active" && 
                v.Capacities.DeadWeight.HasValue && 
                v.Capacities.DeckArea.HasValue).ToList();

            var distanceMatrix = BuildDistanceMatrix(locations);
            var candidateVoyages = new List<VoyageCandidate>();

            // SORT loads BY urgencyScore DESC, earliestDeparture ASC
            var sortedLoads = loads
                .OrderByDescending(l => l.UrgencyScore)
                .ThenBy(l => l.EarliestDeparture)
                .ToList();

            foreach (var load in sortedLoads)
            {
                var feasibleAssignments = new List<VoyageCandidate>();

                // 1. Try Existing Voyages (Database)
                foreach (var voyage in existingVoyages.Where(v => !v.IsDeleted))
                {
                    if (IsRouteCompatible(load, voyage) && 
                        IsTimeWindowCompatible(load, voyage) && 
                        HasCapacity(load, voyage, vessels.FirstOrDefault(v => v.VesselId == voyage.VesselId)))
                    {
                        var newVoyage = SimulateAddLoad(voyage, load, vessels.FirstOrDefault(v => v.VesselId == voyage.VesselId));
                        newVoyage.Score = ScoreVoyage(newVoyage);
                        feasibleAssignments.Add(newVoyage);
                    }
                }

                // 2. Try Planned Candidates (In-session)
                foreach (var candidate in candidateVoyages)
                {
                    if (IsRouteCompatible(load, candidate) && 
                        IsTimeWindowCompatible(load, candidate) && 
                        HasCapacity(load, candidate, vessels.FirstOrDefault(v => v.VesselId == candidate.VesselId)))
                    {
                        var updatedCandidate = SimulateMergeLoad(candidate, load, vessels.FirstOrDefault(v => v.VesselId == candidate.VesselId));
                        updatedCandidate.Score = ScoreVoyage(updatedCandidate);
                        feasibleAssignments.Add(updatedCandidate);
                    }
                }

                // 3. Try Creating New Voyages
                foreach (var vessel in activeVessels)
                {
                    if (VesselCanServeRoute(vessel, load))
                    {
                        var newVoyage = CreateNewVoyageCandidate(vessel, load, distanceMatrix, locations);
                        if (HasCapacity(load, newVoyage, vessel))
                        {
                            newVoyage.Score = ScoreVoyage(newVoyage);
                            feasibleAssignments.Add(newVoyage);
                        }
                    }
                }

                // 4. Select Best Option
                if (feasibleAssignments.Any())
                {
                    var best = feasibleAssignments.OrderByDescending(f => f.Score).First();
                    CommitVoyage(best, candidateVoyages);
                }
            }

            return candidateVoyages;
        }

        private List<RequestLoad> BuildRequestLoads(List<MovementRequest> requests)
        {
            var loads = new List<RequestLoad>();
            foreach (var req in requests)
            {
                var load = new RequestLoad
                {
                    RequestId = req.RequestId,
                    OriginId = req.OriginId,
                    DestinationId = req.DestinationId,
                    EarliestDeparture = req.EarliestDeparture,
                    LatestDeparture = req.LatestDeparture ?? req.EarliestDeparture.AddDays(2), // Allow buffer
                    EarliestArrival = req.EarliestArrival ?? req.EarliestDeparture.AddHours(12),
                    LatestArrival = req.LatestArrival,
                    TotalDeckArea = req.Items.Sum(i => UnitConverter.ToSquareMeters(i.Dimensions, i.DimensionUnit)),
                    TotalWeight = req.Items.Sum(i => UnitConverter.ToMetricTonnes(i.Weight ?? 0, i.WeightUnit)),
                    ItemIds = req.Items.Select(i => i.ItemId).ToList(),
                    ItemCount = req.Items.Count
                };

                load.UrgencyScore = CalculateUrgencyScore(req.UrgencyId, load.LatestDeparture);
                loads.Add(load);
            }
            return loads;
        }

        private double CalculateUrgencyScore(string urgencyId, DateTime latestDeparture)
        {
            double baseScore = urgencyId switch
            {
                "production-critical" => 90,
                "project-critical" => 70,
                "hsse-environmental" => 80,
                "routine-operations" => 30,
                "critical" => 85,
                "urgent" => 60,
                "priority" => 45,
                "routine" => 20,
                _ => 10
            };

            var hoursLeft = (latestDeparture - DateTime.UtcNow).TotalHours;
            if (hoursLeft < 0) hoursLeft = 0;
            
            var timePremium = Math.Max(0, (72 - hoursLeft) / 2); 
            return baseScore + timePremium;
        }

        private Dictionary<string, Dictionary<string, double>> BuildDistanceMatrix(List<Location> locations)
        {
            var matrix = new Dictionary<string, Dictionary<string, double>>();
            foreach (var locA in locations)
            {
                matrix[locA.LocationId] = new Dictionary<string, double>();
                foreach (var locB in locations)
                {
                    if (locA.LocationId == locB.LocationId)
                    {
                        matrix[locA.LocationId][locB.LocationId] = 0;
                    }
                    else if (locA.Latitude.HasValue && locA.Longitude.HasValue && 
                             locB.Latitude.HasValue && locB.Longitude.HasValue)
                    {
                        matrix[locA.LocationId][locB.LocationId] = HaversineDistance(
                            locA.Latitude.Value, locA.Longitude.Value,
                            locB.Latitude.Value, locB.Longitude.Value);
                    }
                }
            }
            return matrix;
        }

        private double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var rLat1 = ToRadians(lat1);
            var rLat2 = ToRadians(lat2);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2) * Math.Cos(rLat1) * Math.Cos(rLat2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return RadiusOfEarthKm * c;
        }

        private double ToRadians(double angle) => Math.PI * angle / 180.0;

        private bool IsRouteCompatible(RequestLoad load, Voyage voyage)
        {
            return load.OriginId == voyage.OriginId && load.DestinationId == voyage.DestinationId;
        }

        private bool IsRouteCompatible(RequestLoad load, VoyageCandidate candidate)
        {
            return load.OriginId == candidate.OriginId && load.DestinationId == candidate.DestinationId;
        }

        private bool IsTimeWindowCompatible(RequestLoad load, Voyage voyage)
        {
            // Existing voyages have fixed departure/ETA
            const int toleranceHours = 12;
            return load.EarliestDeparture <= voyage.DepartureDateTime.AddHours(toleranceHours) &&
                   load.LatestArrival >= voyage.Eta.AddHours(-toleranceHours);
        }

        private bool IsTimeWindowCompatible(RequestLoad load, VoyageCandidate candidate)
        {
            // For candidates, we check if there's an overlapping "window of opportunity"
            // ED1 <= LA2 && ED2 <= LA1
            var maxEarliestDeparture = candidate.AssignedLoads.Max(l => l.EarliestDeparture);
            if (load.EarliestDeparture > maxEarliestDeparture) maxEarliestDeparture = load.EarliestDeparture;

            var minLatestArrival = candidate.AssignedLoads.Min(l => l.LatestArrival);
            if (load.LatestArrival < minLatestArrival) minLatestArrival = load.LatestArrival;

            // Simple check: do they overlap?
            return maxEarliestDeparture <= minLatestArrival.AddHours(-12); // Must leave 12h for transit
        }

        private bool HasCapacity(RequestLoad load, Voyage voyage, Vessel? vessel)
        {
            if (vessel == null) return false;
            var currentDeck = (voyage.DeckUtil / 100 * (vessel.Capacities.DeckArea ?? 0));
            var currentWeight = (voyage.WeightUtil / 100 * (vessel.Capacities.DeadWeight ?? 0));
            
            if (currentDeck + load.TotalDeckArea > (vessel.Capacities.DeckArea ?? 0)) return false;
            if (currentWeight + load.TotalWeight > (vessel.Capacities.DeadWeight ?? 0)) return false;
            return true;
        }

        private bool HasCapacity(RequestLoad load, VoyageCandidate voyage, Vessel? vessel)
        {
            if (vessel == null) return false;
            if (voyage.TotalDeckUsed + load.TotalDeckArea > (vessel.Capacities.DeckArea ?? 1000000)) return false;
            if (voyage.TotalWeightUsed + load.TotalWeight > (vessel.Capacities.DeadWeight ?? 1000000)) return false;
            return true;
        }

        private VoyageCandidate SimulateAddLoad(Voyage voyage, RequestLoad load, Vessel? vessel)
        {
            var cand = new VoyageCandidate
            {
                VoyageId = voyage.VoyageId,
                VesselId = voyage.VesselId,
                VesselName = voyage.VesselName,
                OriginId = voyage.OriginId,
                OriginName = voyage.OriginName,
                DestinationId = voyage.DestinationId,
                DestinationName = voyage.DestinationName,
                DepartureTime = voyage.DepartureDateTime,
                ArrivalTime = voyage.Eta,
                AssignedLoads = new List<RequestLoad> { load }, 
                TotalDeckUsed = (voyage.DeckUtil / 100 * (vessel?.Capacities.DeckArea ?? 0)) + load.TotalDeckArea,
                TotalWeightUsed = (voyage.WeightUtil / 100 * (vessel?.Capacities.DeadWeight ?? 0)) + load.TotalWeight,
                AssignedRequestIds = new List<string> { load.RequestId },
                TotalItems = load.ItemCount,
                AggregatedItemIds = load.ItemIds
            };
            cand.UtilisationPercent = CalculateUtilisation(cand, vessel);
            return cand;
        }

        private VoyageCandidate SimulateMergeLoad(VoyageCandidate candidate, RequestLoad load, Vessel? vessel)
        {
            var newLoads = new List<RequestLoad>(candidate.AssignedLoads) { load };
            var cand = new VoyageCandidate
            {
                VesselId = candidate.VesselId,
                VesselName = candidate.VesselName,
                OriginId = candidate.OriginId,
                OriginName = candidate.OriginName,
                DestinationId = candidate.DestinationId,
                DestinationName = candidate.DestinationName,
                AssignedLoads = newLoads,
                TotalDeckUsed = candidate.TotalDeckUsed + load.TotalDeckArea,
                TotalWeightUsed = candidate.TotalWeightUsed + load.TotalWeight,
                AssignedRequestIds = new List<string>(candidate.AssignedRequestIds) { load.RequestId },
                TotalItems = candidate.TotalItems + load.ItemCount,
                AggregatedItemIds = new List<string>(candidate.AggregatedItemIds).Concat(load.ItemIds).ToList()
            };

            // Recalculate best window
            cand.DepartureTime = newLoads.Max(l => l.EarliestDeparture);
            cand.ArrivalTime = cand.DepartureTime.AddHours((candidate.ArrivalTime - candidate.DepartureTime).TotalHours);
            cand.UtilisationPercent = CalculateUtilisation(cand, vessel);
            return cand;
        }

        private bool VesselCanServeRoute(Vessel vessel, RequestLoad load)
        {
            return true;
        }

        private VoyageCandidate CreateNewVoyageCandidate(Vessel vessel, RequestLoad load, Dictionary<string, Dictionary<string, double>> distanceMatrix, List<Location> locations)
        {
            var voyage = new VoyageCandidate
            {
                VesselId = vessel.VesselId,
                VesselName = vessel.VesselName,
                OriginId = load.OriginId,
                OriginName = locations.FirstOrDefault(l => l.LocationId == load.OriginId)?.LocationName,
                DestinationId = load.DestinationId,
                DestinationName = locations.FirstOrDefault(l => l.LocationId == load.DestinationId)?.LocationName,
                DepartureTime = load.EarliestDeparture
            };

            var distance = 0.0;
            if (distanceMatrix.ContainsKey(load.OriginId) && distanceMatrix[load.OriginId].ContainsKey(load.DestinationId))
            {
                distance = distanceMatrix[load.OriginId][load.DestinationId];
            }

            var speed = vessel.Performance.ServiceSpeed ?? 10.0; 
            var hours = distance / (speed * 1.852); 

            voyage.ArrivalTime = voyage.DepartureTime.AddHours(hours);
            voyage.TotalDeckUsed = load.TotalDeckArea;
            voyage.TotalWeightUsed = load.TotalWeight;
            voyage.AssignedLoads = new List<RequestLoad> { load };
            voyage.TotalCost = CalculateVoyageCost(vessel, hours);
            voyage.UtilisationPercent = CalculateUtilisation(voyage, vessel);
            voyage.AssignedRequestIds = new List<string> { load.RequestId };
            voyage.TotalItems = load.ItemCount;
            voyage.AggregatedItemIds = load.ItemIds;

            return voyage;
        }

        private double ScoreVoyage(VoyageCandidate voyage)
        {
            var utilisationScore = voyage.UtilisationPercent * 0.35;
            var costScore = Math.Max(0, (100000 - voyage.TotalCost) / 100000 * 0.25);
            
            var deadlineScore = 0.25; 
            foreach(var load in voyage.AssignedLoads) {
                if (voyage.ArrivalTime > load.LatestArrival) {
                    deadlineScore = 0;
                    break;
                }
            }

            var consolidationScore = Math.Min(15, voyage.AssignedLoads.Count * 5); // 5 points per load, cap at 15

            return utilisationScore + costScore + deadlineScore + consolidationScore;
        }

        private double CalculateVoyageCost(Vessel vessel, double hours)
        {
            var fuelCost = hours * (vessel.Financials.FuelConsumptionRate ?? 0);
            var operatingCost = hours * (vessel.Financials.HourlyOperatingCost ?? 0);
            return fuelCost + operatingCost + (vessel.Financials.MobilisationCost ?? 0);
        }

        private double CalculateUtilisation(VoyageCandidate voyage, Vessel? vessel)
        {
            if (vessel == null) return 0;
            var deckUtil = voyage.TotalDeckUsed / (vessel.Capacities.DeckArea ?? 1.0);
            var weightUtil = voyage.TotalWeightUsed / (vessel.Capacities.DeadWeight ?? 1.0);
            return Math.Max(deckUtil, weightUtil) * 100;
        }

        private void CommitVoyage(VoyageCandidate best, List<VoyageCandidate> candidates)
        {
            if (best.VoyageId != null)
            {
                // Update existing voyage logic would go here
                var existing = candidates.FirstOrDefault(c => c.VoyageId == best.VoyageId);
                if (existing != null)
                {
                    existing.AssignedLoads = best.AssignedLoads;
                    existing.AssignedRequestIds = best.AssignedRequestIds;
                    existing.AggregatedItemIds = best.AggregatedItemIds;
                    existing.TotalDeckUsed = best.TotalDeckUsed;
                    existing.TotalWeightUsed = best.TotalWeightUsed;
                    existing.TotalItems = best.TotalItems;
                    existing.UtilisationPercent = best.UtilisationPercent;
                    existing.Score = best.Score;
                }
                else
                {
                    candidates.Add(best);
                }
            }
            else
            {
                // Identification by Vessel and Route for session-level merging
                var existingCand = candidates.FirstOrDefault(c => 
                    c.VesselId == best.VesselId && 
                    c.OriginId == best.OriginId && 
                    c.DestinationId == best.DestinationId &&
                    Math.Abs((c.DepartureTime - best.DepartureTime).TotalHours) < 24);

                if (existingCand != null)
                {
                    existingCand.AssignedLoads = best.AssignedLoads;
                    existingCand.AssignedRequestIds = best.AssignedRequestIds;
                    existingCand.AggregatedItemIds = best.AggregatedItemIds;
                    existingCand.TotalDeckUsed = best.TotalDeckUsed;
                    existingCand.TotalWeightUsed = best.TotalWeightUsed;
                    existingCand.TotalItems = best.TotalItems;
                    existingCand.UtilisationPercent = best.UtilisationPercent;
                    existingCand.Score = best.Score;
                    existingCand.DepartureTime = best.DepartureTime;
                    existingCand.ArrivalTime = best.ArrivalTime;
                }
                else
                {
                    candidates.Add(best);
                }
            }
        }
    }
}
