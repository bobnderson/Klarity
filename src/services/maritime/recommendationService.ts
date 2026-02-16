import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import type { Vessel } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";

dayjs.extend(isBetween);

export interface VoyageRecommendation {
  id: string;
  vesselId: string;
  vesselName: string;
  origin: string;
  originId: string;
  destination: string;
  destinationId: string;
  departureDateTime: string;
  eta: string;
  requestIds: string[];
  itemIds: string[];
  score: number;
  reason: string;
  type: "NewVoyage" | "AddToVoyage";
  status: "Pending" | "Accepted" | "Rejected";
  targetVoyageId?: string;
  totalWeight?: number;
  totalDeckArea?: number;
  itemCount?: number;
  messages?: string[];
}

export interface RecommendationSummary {
  recommendations: VoyageRecommendation[];
  urgentUnscheduled: MovementRequest[];
  overallScore: number;
}

interface Candidate {
  vessel: Vessel;
  score: number;
  reason: string;
  type: "NewVoyage" | "AddToVoyage";
  departure: dayjs.Dayjs;
  eta: dayjs.Dayjs;
  targetVoyageId?: string;
}

/**
 * Analyzes unscheduled requests, scheduled voyage and vessels to generate voyage recommendations.
 */
export function generateVoyageRecommendations(
  vessels: Vessel[],
  requests: MovementRequest[],
): RecommendationSummary {
  const recommendations: VoyageRecommendation[] = [];
  const urgentUnscheduled: MovementRequest[] = [];

  // 1. Group Requests by Route (Origin -> Destination)
  const routeGroups: Record<string, MovementRequest[]> = {};

  requests.forEach((req) => {
    // Only consider unscheduled or pending requests
    if (req.scheduleIndicator === "Scheduled") return;

    const key = `${req.originId}-${req.destinationId}`;
    if (!routeGroups[key]) {
      routeGroups[key] = [];
    }
    routeGroups[key].push(req);
  });

  // 2. Analyze each route group
  Object.entries(routeGroups).forEach(([routeKey, groupRequests]) => {
    const [origin, destination] = routeKey.split("-");

    // Sort by urgency (Urgent > Priority > Routine)
    const urgencyScore: Record<string, number> = {
      Urgent: 3,
      Priority: 2,
      Routine: 1,
    };

    const sortedRequests = groupRequests.sort((a, b) => {
      const scoreA = urgencyScore[a.urgency || "Routine"] || 0;
      const scoreB = urgencyScore[b.urgency || "Routine"] || 0;
      return scoreB - scoreA;
    });

    const highPriorityReqs = sortedRequests.filter(
      (r) => r.urgency === "Urgent" || r.urgency === "Priority",
    );

    // If no high priority, just take the first one
    const driverRequest =
      highPriorityReqs.length > 0 ? highPriorityReqs[0] : sortedRequests[0];

    if (!driverRequest) return;

    // Window: Start = driver's earliest departure
    const windowStart = dayjs(driverRequest.earliestDeparture);

    // Calculate total weight and collect item IDs
    let totalWeight = 0;
    const allItemIds: string[] = [];

    groupRequests.forEach((req) => {
      // Use pre-calculated totalWeight if available, otherwise sum items
      if (req.totalWeight) {
        totalWeight += req.totalWeight;
      } else {
        totalWeight += req.items.reduce(
          (sum, item) => sum + (item.weight || 0),
          0,
        );
      }

      req.items.forEach((item) => {
        allItemIds.push(item.itemId);
      });
    });

    // 3. Find Candidate Vessels (Both New and Existing Voyages)
    const candidates: Candidate[] = [];

    vessels.forEach((vessel) => {
      // --- A. Check Existing Voyages (Add to Voyage) ---
      vessel.voyages.forEach((voyage) => {
        // 1. Route constraints
        if (
          (voyage.originName || voyage.originId) !== origin ||
          (voyage.destinationName || voyage.destinationId) !== destination
        )
          return;

        // 2. Time constraints (Must depart after window start)
        // Allowing a small buffer (e.g., 2 hours before) for quick loading if feasible, but strictly after is safer
        const depTime = dayjs(voyage.departureDateTime);
        if (depTime.isBefore(windowStart.subtract(2, "hour"))) return;

        // 3. Capacity constraints
        const maxWeight = vessel.capacities?.deadWeight || 1000;
        const currentLoad = maxWeight * (voyage.weightUtil / 100);
        const remainingCapacity = maxWeight - currentLoad;

        if (remainingCapacity >= totalWeight) {
          // Found a match!
          let score = 150; // Base high score for utilizing existing voyage (higher than any NewVoyage)

          // Bonus for high capacity utilization
          const util =
            (totalWeight / (vessel.capacities?.deadWeight || 1)) * 100;
          if (util > 50) score += 20;

          candidates.push({
            vessel,
            score,
            reason: `Add to scheduled voyage ${voyage.voyageId}`,
            type: "AddToVoyage",
            departure: depTime,
            eta: dayjs(voyage.eta),
            targetVoyageId: voyage.voyageId,
          });
        }
      });

      // --- B. Check For New Voyage Opportunities ---
      const lastVoyage = vessel.voyages[vessel.voyages.length - 1];
      let availabilityTime = dayjs(); // Available now by default
      let location = "Unknown";

      if (lastVoyage) {
        availabilityTime = dayjs(lastVoyage.eta).add(4, "hour"); // +4h turnaround
        location = lastVoyage.destinationName || lastVoyage.destinationId;
      }

      // Check availability overlap
      const isAvailable = availabilityTime.isBefore(windowStart.add(2, "day"));

      // Check capacity
      const capacityOK = (vessel.capacities?.deadWeight || 1000) > totalWeight;

      if (isAvailable && capacityOK) {
        let score = 50; // Base score for new voyage
        if (location === origin) score += 30; // Already there

        // Bonus for high capacity utilization
        const util = (totalWeight / (vessel.capacities?.deadWeight || 1)) * 100;
        if (util > 50) score += 20;

        const reason =
          location === origin
            ? `Available at ${origin}`
            : `Can reposition to ${origin}`;

        // Departs: Max(WindowStart, VesselAvailability)
        const depDate = availabilityTime.isAfter(windowStart)
          ? availabilityTime
          : windowStart;

        // Estimate Duration: 0.5 day for same region/short hop
        const travelTimeDays = origin === destination ? 0.5 : 1;
        const etaDate = depDate.add(travelTimeDays, "day");

        candidates.push({
          vessel,
          score,
          reason,
          type: "NewVoyage",
          departure: depDate,
          eta: etaDate,
        });
      }
    });

    // 4. Select Best Candidate
    const bestCandidate = candidates.sort((a, b) => b.score - a.score)[0];

    if (bestCandidate && bestCandidate.score > 0) {
      recommendations.push({
        id: `REC-${Date.now()}-${bestCandidate.vessel.vesselId}-${routeKey}`,
        vesselId: bestCandidate.vessel.vesselId || "",
        vesselName: bestCandidate.vessel.vesselName,
        origin: groupRequests[0].originName || groupRequests[0].originId,
        originId: origin,
        destination:
          groupRequests[0].destinationName || groupRequests[0].destinationId,
        destinationId: destination,
        departureDateTime: bestCandidate.departure.toISOString(),
        eta: bestCandidate.eta.toISOString(),
        requestIds: groupRequests.map((r) => r.requestId),
        itemIds: allItemIds, // Populate itemIds
        score: bestCandidate.score,
        reason: bestCandidate.reason,
        type: bestCandidate.type,
        status: "Pending",
        targetVoyageId: bestCandidate.targetVoyageId,
      });
    } else {
      // If no candidate found, mark urgent/priority as unscheduled alert
      highPriorityReqs.forEach((req) => {
        urgentUnscheduled.push(req);
      });
    }
  });

  // Calculate overall score
  const avgScore =
    recommendations.length > 0
      ? recommendations.reduce((acc, curr) => acc + curr.score, 0) /
        recommendations.length
      : 0.95;

  const penalty = urgentUnscheduled.length * 0.05;
  const overallScore = Math.max(0, Math.min(1, avgScore - penalty));

  return { recommendations, urgentUnscheduled, overallScore };
}
