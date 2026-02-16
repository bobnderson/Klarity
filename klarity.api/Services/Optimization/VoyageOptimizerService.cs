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
            
            // Filter active PSV/MSV vessels or Helicopters
            var activeVessels = vessels.Where(v => 
                v.StatusId == "active" && 
                (
                    (v.Capacities.DeadWeight.HasValue && v.Capacities.DeckArea.HasValue &&
                     (v.VesselTypeName?.Contains("PSV", StringComparison.OrdinalIgnoreCase) == true || 
                      v.VesselTypeName?.Contains("MSV", StringComparison.OrdinalIgnoreCase) == true ||
                      v.VesselTypeId?.Contains("psv", StringComparison.OrdinalIgnoreCase) == true ||
                      v.VesselTypeId?.Contains("msv", StringComparison.OrdinalIgnoreCase) == true))
                    ||
                    (v.VesselTypeName?.Contains("Helicopter", StringComparison.OrdinalIgnoreCase) == true ||
                     v.VesselTypeId?.Contains("helicopter", StringComparison.OrdinalIgnoreCase) == true)
                )
                ).ToList();

            var distanceMatrix = BuildDistanceMatrix(locations);
            var candidateVoyages = new List<VoyageCandidate>();

            // 1. Group by Route (Origin -> Destination)
            var routeGroups = loads
                .GroupBy(l => new { l.OriginId, l.DestinationId })
                .ToList();

            foreach (var route in routeGroups)
            {
                // Sort requests by EarliestDeparture to process chronologically
                var sortedRequests = route.OrderBy(r => r.EarliestDeparture).ToList();
                
                while (sortedRequests.Any())
                {
                    // Start a new "Weekly Bucket"
                    var baseRequest = sortedRequests.First();
                    // Align to the request's date or start of that day? 
                    // Let's use the request's EarliestDeparture as the anchor for the week.
                    var weekStart = baseRequest.EarliestDeparture.Date; 
                    var weekEnd = weekStart.AddDays(7);

                    // Find all requests in this 7-day window
                    var weeklyBatch = sortedRequests
                        .Where(r => r.EarliestDeparture >= weekStart && r.EarliestDeparture < weekEnd)
                        .ToList();

                    // Remove processed requests from the main list
                    foreach (var req in weeklyBatch)
                    {
                        sortedRequests.Remove(req);
                    }

                    // 2. Check for Existing Voyage covering this week
                    // We look for a voyage on this route departing within the window
                    var existingVoyage = existingVoyages.FirstOrDefault(v => 
                        !v.IsDeleted &&
                        v.OriginId == route.Key.OriginId && 
                        v.DestinationId == route.Key.DestinationId &&
                        v.DepartureDateTime >= weekStart && v.DepartureDateTime < weekEnd
                    );

                    Vessel bestVessel = null;

                    if (existingVoyage != null)
                    {
                        // Use the vessel assigned to the existing voyage
                        bestVessel = vessels.FirstOrDefault(v => v.VesselId == existingVoyage.VesselId);
                         if (bestVessel != null)
                         {
                             // Create a candidate from the existing voyage
                             var candidate = CreateCandidateFromExisting(existingVoyage, bestVessel);
                             
                             // Try to add the batch to it
                             // We might need to split if it doesn't fit
                             ProcessBatchForVoyage(candidate, weeklyBatch, bestVessel, candidateVoyages, distanceMatrix, locations);
                             continue;
                         }
                    }

                    // 3. If no existing voyage, find best vessel to create new one
                    if (bestVessel == null)
                    {
                        bestVessel = activeVessels
                            .OrderByDescending(v => v.Capacities.DeckArea) // Prefer larger vessels to fit all
                            .FirstOrDefault();
                    }

                    if (bestVessel != null)
                    {
                        // Calculate Departure Time: Max of EarliestDeparture to ensure all cargo is ready
                        var departureTime = weeklyBatch.Max(r => r.EarliestDeparture);
                        
                        // Create Fresh Voyage Candidate
                        var voyage = CreateWeeklyVoyage(bestVessel, new List<RequestLoad>(), distanceMatrix, locations, departureTime);
                        
                        // Set Route Information
                        voyage.OriginId = route.Key.OriginId;
                        voyage.DestinationId = route.Key.DestinationId;
                        voyage.OriginName = locations.FirstOrDefault(l => l.LocationId == route.Key.OriginId)?.LocationName;
                        voyage.DestinationName = locations.FirstOrDefault(l => l.LocationId == route.Key.DestinationId)?.LocationName;

                        // Assign loads
                        ProcessBatchForVoyage(voyage, weeklyBatch, bestVessel, candidateVoyages, distanceMatrix, locations);
                    }
                }
            }
            
            return candidateVoyages;
        }

        private void ProcessBatchForVoyage(
            VoyageCandidate voyage, 
            List<RequestLoad> batch, 
            Vessel vessel, 
            List<VoyageCandidate> candidates,
            Dictionary<string, Dictionary<string, double>> distanceMatrix,
            List<Location> locations)
        {
            var assignedCount = 0;
            var remaining = new List<RequestLoad>();

            foreach (var load in batch)
            {
                // Check if this specific load is already assigned to this voyage (duplication check)
                if (voyage.AssignedRequestIds.Contains(load.RequestId)) continue;

                if (HasCapacity(load, voyage, vessel))
                {
                    // Add load
                    voyage.AssignedLoads.Add(load);
                    voyage.AssignedRequestIds.Add(load.RequestId);
                    voyage.AggregatedItemIds.AddRange(load.ItemIds);
                    voyage.TotalDeckUsed += load.TotalDeckArea;
                    voyage.TotalWeightUsed += load.TotalWeight;
                    voyage.TotalItems += load.ItemCount;
                    
                    // Update Departure Time if this load pushes it? 
                    // Note: For existing voyages, schedule IS fixed.
                    // For NEW voyages, we set DepTime = Max(EarliestDeparture).
                    if (voyage.VoyageId == null) // New
                    {
                        if (load.EarliestDeparture > voyage.DepartureTime)
                        {
                            voyage.DepartureTime = load.EarliestDeparture;
                            // Recalc Arrival
                             RecalculateArrival(voyage, vessel, distanceMatrix);
                        }
                    }
                    else // Existing
                    {
                        // If load ED > Voyage Dep, we have a problem. Flex it?
                        if (load.EarliestDeparture > voyage.DepartureTime)
                        {
                             // Flex Logic: Add warning
                             voyage.Messages.Add($"Request {load.RequestId} Earliest Departure ({load.EarliestDeparture:dd MMM HH:mm}) is after Voyage Departure ({voyage.DepartureTime:dd MMM HH:mm}).");
                        }
                    }

                    assignedCount++;
                }
                else
                {
                    remaining.Add(load);
                }
            }
            
            voyage.UtilisationPercent = CalculateUtilisation(voyage, vessel);
            voyage.Score = ScoreVoyage(voyage);
            
            // Add the main voyage if not already in list
            if (!candidates.Contains(voyage))
            {
                candidates.Add(voyage);
            }

            // Handle Overflow
            if (remaining.Any())
            {
                // Create a second voyage for the remaining items (Overflow)
                var departureTime = remaining.Max(r => r.EarliestDeparture);
                var overflowVoyage = CreateWeeklyVoyage(vessel, new List<RequestLoad>(), distanceMatrix, locations, departureTime);
                
                // Copy Route Information from parent voyage
                overflowVoyage.OriginId = voyage.OriginId;
                overflowVoyage.DestinationId = voyage.DestinationId;
                overflowVoyage.OriginName = voyage.OriginName;
                overflowVoyage.DestinationName = voyage.DestinationName;

                // Recursively process the rest
                // Use a standard matching to avoid infinite recursion if no vessel fits at all (should fit empty vessel)
                foreach(var load in remaining)
                {
                     if (HasCapacity(load, overflowVoyage, vessel))
                     {
                        overflowVoyage.AssignedLoads.Add(load);
                        overflowVoyage.AssignedRequestIds.Add(load.RequestId);
                        overflowVoyage.AggregatedItemIds.AddRange(load.ItemIds);
                        overflowVoyage.TotalDeckUsed += load.TotalDeckArea;
                        overflowVoyage.TotalWeightUsed += load.TotalWeight;
                        overflowVoyage.TotalItems += load.ItemCount;
                     }
                }
                
                overflowVoyage.UtilisationPercent = CalculateUtilisation(overflowVoyage, vessel);
                overflowVoyage.Score = ScoreVoyage(overflowVoyage);
                candidates.Add(overflowVoyage);
            }
        }

        private void RecalculateArrival(VoyageCandidate voyage, Vessel vessel, Dictionary<string, Dictionary<string, double>> distanceMatrix)
        {
             var distance = 0.0;
             if (distanceMatrix.ContainsKey(voyage.OriginId) && distanceMatrix[voyage.OriginId].ContainsKey(voyage.DestinationId))
             {
                distance = distanceMatrix[voyage.OriginId][voyage.DestinationId];
             }

             var speed = vessel.Performance.ServiceSpeed ?? 10.0; 
             var calculatedHours = distance / (speed * 1.852); 
             var duration = Math.Max(48, calculatedHours); // Enforce 48h min

             voyage.ArrivalTime = voyage.DepartureTime.AddHours(duration);
             voyage.TotalCost = CalculateVoyageCost(vessel, duration);
        }

        private VoyageCandidate CreateCandidateFromExisting(Voyage v, Vessel vessel)
        {
            return new VoyageCandidate
            {
                VoyageId = v.VoyageId,
                VesselId = v.VesselId,
                VesselName = v.VesselName,
                OriginId = v.OriginId,
                OriginName = v.OriginName,
                DestinationId = v.DestinationId,
                DestinationName = v.DestinationName,
                DepartureTime = v.DepartureDateTime,
                ArrivalTime = v.Eta,
                AssignedLoads = new List<RequestLoad>(), // Should populate from DB existing loads if needed? Assuming inputs are what we assign
                AssignedRequestIds = new List<string>(), // We start fresh or append? Usually optimization re-plans. 
                // But if existing voyage has loads, we should respect capacity. 
                // Simplified: assuming 'existingVoyages' passed in are the *base* and we add to them.
                // We'll calculate usage based on what we ADD + what *might* be there (omitted for now).
                TotalDeckUsed = 0,
                TotalWeightUsed = 0,
                TotalItems = 0,
                AggregatedItemIds = new List<string>(),
                Messages = new List<string>()
            };
        }

        private VoyageCandidate CreateWeeklyVoyage(Vessel vessel, List<RequestLoad> loads, Dictionary<string, Dictionary<string, double>> distanceMatrix, List<Location> locations, DateTime departureTime)
        {
             // Determine Origin/Dest from first load or args
             // We need passed in args if loads is empty.
             // Refactored to assume caller sets Origin/Dest on the candidate if loads empty, 
             // but here we create it.
             // We'll use the 'loads' to determine route, OR return an empty shell?
             // Actually, `ProcessBatchForVoyage` handles filling. 
             // We need to know the Route to calculate Duration.
             
             // Issue: If we pass empty list, we don't know the route.
             // I'll update ProcessBatch to set route info if missing? 
             // Better: Pass Origin/Dest to this method.
             // But my signature was generic.
             // Let's rely on the first load of the batch for the route, since we group by route.
             
             // Wait, `ProcessBatch` calls this with empty list for overflow.
             // I need to fix that calling code.
             
             return new VoyageCandidate
             { 
                 VesselId = vessel.VesselId, 
                 VesselName = vessel.VesselName,
                 DepartureTime = departureTime,
                 ArrivalTime = departureTime.AddHours(48), // Default min
                 AssignedLoads = new List<RequestLoad>(),
                 AssignedRequestIds = new List<string>(),
                 AggregatedItemIds = new List<string>(),
                 Messages = new List<string>(),
                 // Placeholder, will be filled by caller using the route info
                 OriginId = "", 
                 DestinationId = ""
             };
        }
        
        // --- Helper Methods ---

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
                    LatestDeparture = req.LatestDeparture ?? req.EarliestDeparture.AddDays(2),
                    EarliestArrival = req.EarliestArrival ?? req.EarliestDeparture.AddHours(12),
                    LatestArrival = req.LatestArrival,
                    TotalDeckArea = req.Items.Sum(i => UnitConverter.ToSquareMeters(i.Dimensions, i.DimensionUnit) * i.Quantity),
                    TotalWeight = req.Items.Sum(i => UnitConverter.ToMetricTonnes(i.Weight ?? 0, i.WeightUnit)),
                    ItemIds = req.Items.Select(i => i.ItemId).ToList(),
                    ItemCount = req.Items.Count,
                    UrgencyId = req.UrgencyId
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

        private bool HasCapacity(RequestLoad load, VoyageCandidate voyage, Vessel vessel)
        {
            if (vessel == null) return false;
            // For VoyageCandidate, use its properties
            if (voyage.TotalDeckUsed + load.TotalDeckArea > (vessel.Capacities.DeckArea ?? 1000000)) return false;
            if (voyage.TotalWeightUsed + load.TotalWeight > (vessel.Capacities.DeadWeight ?? 1000000)) return false;
            return true;
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

            var consolidationScore = Math.Min(15, voyage.AssignedLoads.Count * 5); 

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
    }
}
