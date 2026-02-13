// src/services/maritime/simulationService.ts
import type { SimulationStop } from "../../types/maritime/simulation";

import type {
  SimulationRequest,
  SimulationVessel,
  SimulationConfig,
  SimulationScenario,
} from "../../types/maritime/simulation";

// -------------------------------------------------------------
// Internal Types
// -------------------------------------------------------------

interface StopNode {
  stopId: string;
  type: "Pickup" | "Dropoff";
  requestId: string;
  location: { lat: number; lng: number };
  earliestTime: number;
  latestTime: number;
  serviceDurationHours: number;
  demand: {
    weight: number;
    volume: number;
    deckSpace: number;
    personnel: number;
  };
}

interface VesselRoute {
  vessel: SimulationVessel;
  stops: StopNode[];
  totalDistanceNm: number;
  totalTimeHours: number;
  totalCost: number;
  utilization: number;
}

// -------------------------------------------------------------
// Distance + Travel Time Helpers
// -------------------------------------------------------------

const NM_PER_METER = 0.000539957;

const haversineNm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  const distMeters = R * c;
  return distMeters * NM_PER_METER;
};

const travelTimeHours = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  vessel: SimulationVessel,
  config: SimulationConfig,
): number => {
  const distNm = haversineNm(from, to);
  const speed =
    vessel.cruisingSpeed *
    config.vesselSpeedMultiplier *
    config.weatherDelayFactor;

  if (speed <= 0) return Infinity;

  return distNm / speed + config.portCongestionDelay;
};

// -------------------------------------------------------------
// Convert Requests → Stop Nodes
// -------------------------------------------------------------

const buildStopsFromRequests = (requests: SimulationRequest[]): StopNode[] => {
  const stops: StopNode[] = [];

  for (const req of requests) {
    const baseDemand = {
      weight: req.cargoWeight ?? 0,
      volume: req.cargoVolume ?? 0,
      deckSpace: req.deckSpaceRequired ?? 0,
      personnel: req.personnelCount ?? 0,
    };

    const earliestPickup = new Date(req.earliestPickupTime).getTime();
    const latestDropoff = new Date(req.latestDropoffTime).getTime();

    stops.push({
      stopId: `${req.requestId}-P`,
      type: "Pickup",
      requestId: req.requestId,
      location: req.pickupLocation,
      earliestTime: earliestPickup,
      latestTime: latestDropoff,
      serviceDurationHours: req.loadingDuration,
      demand: baseDemand,
    });

    stops.push({
      stopId: `${req.requestId}-D`,
      type: "Dropoff",
      requestId: req.requestId,
      location: req.dropoffLocation,
      earliestTime: earliestPickup,
      latestTime: latestDropoff,
      serviceDurationHours: req.unloadingDuration,
      demand: {
        weight: -baseDemand.weight,
        volume: -baseDemand.volume,
        deckSpace: -baseDemand.deckSpace,
        personnel: -baseDemand.personnel,
      },
    });
  }

  return stops;
};

// -------------------------------------------------------------
// Feasibility Check
// -------------------------------------------------------------

const isFeasibleInsertion = (
  route: VesselRoute,
  pickup: StopNode,
  vessel: SimulationVessel,
): boolean => {
  const totalStops = route.stops.length + 2;
  if (totalStops > vessel.maxStopsAllowed) return false;

  let cumWeight = 0;
  let cumVolume = 0;
  let cumDeck = 0;
  let cumPax = 0;

  for (const s of route.stops) {
    cumWeight += s.demand.weight;
    cumVolume += s.demand.volume;
    cumDeck += s.demand.deckSpace;
    cumPax += s.demand.personnel;

    if (cumWeight > vessel.maxWeightCapacity) return false;
    if (cumVolume > vessel.maxVolumeCapacity) return false;
    if (cumDeck > vessel.maxDeckSpace) return false;
  }

  const vesselAvailable = new Date(vessel.availableFromTime).getTime();
  // Relaxing this for mock data/simulations where we might process older requests
  if (pickup.earliestTime < vesselAvailable - 86400000 * 365) return false;

  return true;
};

// -------------------------------------------------------------
// Greedy Initial Route Builder
// -------------------------------------------------------------

const buildInitialRoutes = (
  requests: SimulationRequest[],
  vessels: SimulationVessel[],
  config: SimulationConfig,
): VesselRoute[] => {
  const stops = buildStopsFromRequests(requests);
  const pickups = stops.filter((s) => s.type === "Pickup");
  const dropoffsByReq = new Map(
    stops.filter((s) => s.type === "Dropoff").map((s) => [s.requestId, s]),
  );

  pickups.sort((a, b) => a.earliestTime - b.earliestTime);

  const routes: VesselRoute[] = vessels.map((v) => ({
    vessel: v,
    stops: [],
    totalDistanceNm: 0,
    totalTimeHours: 0,
    totalCost: 0,
    utilization: 0,
  }));

  for (const pickup of pickups) {
    const dropoff = dropoffsByReq.get(pickup.requestId)!;

    let bestRoute: VesselRoute | null = null;
    let bestCostIncrease = Infinity;

    for (const route of routes) {
      if (!isFeasibleInsertion(route, pickup, route.vessel)) continue;

      const lastLocation =
        route.stops.length > 0
          ? route.stops[route.stops.length - 1].location
          : route.vessel.currentLocation;

      const leg1Time = travelTimeHours(
        lastLocation,
        pickup.location,
        route.vessel,
        config,
      );
      const leg2Time = travelTimeHours(
        pickup.location,
        dropoff.location,
        route.vessel,
        config,
      );

      const extraTime =
        leg1Time +
        leg2Time +
        pickup.serviceDurationHours +
        dropoff.serviceDurationHours;

      const fuelLiters = extraTime * route.vessel.fuelConsumptionRate;
      const fuelCost = fuelLiters * config.fuelCostPerLiter;
      const opCost = extraTime * route.vessel.hourlyOperatingCost;
      const costIncrease = fuelCost + opCost;

      if (costIncrease < bestCostIncrease) {
        bestCostIncrease = costIncrease;
        bestRoute = route;
      }
    }

    if (bestRoute) {
      bestRoute.stops.push(pickup, dropoff);
      bestRoute.totalCost += bestCostIncrease;
    }
  }

  for (const route of routes) {
    let dist = 0;
    let time = 0;
    let lastLoc = route.vessel.currentLocation;

    for (const s of route.stops) {
      const legDist = haversineNm(lastLoc, s.location);
      const legTime = travelTimeHours(
        lastLoc,
        s.location,
        route.vessel,
        config,
      );
      dist += legDist;
      time += legTime + s.serviceDurationHours;
      lastLoc = s.location;
    }

    route.totalDistanceNm = dist;
    route.totalTimeHours = time;

    const fuelLiters = time * route.vessel.fuelConsumptionRate;
    const fuelCost = fuelLiters * config.fuelCostPerLiter;
    const opCost = time * route.vessel.hourlyOperatingCost;
    route.totalCost = fuelCost + opCost + route.vessel.mobilisationCost;

    const totalWeightDemand = route.stops.reduce(
      (sum, s) => sum + Math.max(0, s.demand.weight),
      0,
    );
    route.utilization =
      route.vessel.maxWeightCapacity > 0
        ? Math.min(1, totalWeightDemand / route.vessel.maxWeightCapacity)
        : 0;
  }

  return routes;
};

// -------------------------------------------------------------
// Scenario Builder
// -------------------------------------------------------------

const buildScenarioFromRoutes = (
  id: string,
  name: string,
  description: string,
  routes: VesselRoute[],
  config: SimulationConfig,
  unmetRequestIds: string[],
  isOptimal: boolean,
): SimulationScenario => {
  const totalCost = routes.reduce((sum, r) => sum + r.totalCost, 0);
  const totalTime = routes.reduce((sum, r) => sum + r.totalTimeHours, 0);
  const avgUtil =
    routes.length === 0
      ? 0
      : routes.reduce((sum, r) => sum + r.utilization, 0) / routes.length;

  const weatherPenalty = config.weatherDelayFactor < 1 ? 20 : 0;
  const unmetPenalty = unmetRequestIds.length > 0 ? 30 : 0;
  const baseScore = 100 - weatherPenalty - unmetPenalty;

  const score = Math.max(
    10,
    Math.min(99, Math.round(baseScore + avgUtil * 10 - totalCost / 100000)),
  );

  const primaryRoute = routes[0];

  const stops: SimulationStop[] = primaryRoute.stops.map(
    (s): SimulationStop => ({
      locationId: s.stopId,
      locationName: s.type,
      arrival: new Date().toISOString(),
      departure: new Date().toISOString(),
      activity: (s.type === "Pickup" ? "Load" : "Discharge") as
        | "Load"
        | "Discharge",
    }),
  );

  const path = primaryRoute.stops.map((s) => ({
    lat: s.location.lat,
    lng: s.location.lng,
  }));

  return {
    id,
    name,
    description,
    isOptimal,
    score,
    cost: Math.round(totalCost),
    timeHours: totalTime,
    vesselId: primaryRoute.vessel.vesselId,
    vesselName: primaryRoute.vessel.vesselName,
    stops,
    path,
  };
};

// -------------------------------------------------------------
// Main Simulation Entry Point
// -------------------------------------------------------------

export const runSimulation = async (
  config: SimulationConfig,
  requests: SimulationRequest[],
  vessels: SimulationVessel[],
  onProgress?: (progress: number) => void,
): Promise<SimulationScenario[]> => {
  if (onProgress) onProgress(10);
  await new Promise((resolve) => setTimeout(resolve, 200));

  const routes = buildInitialRoutes(requests, vessels, config);
  if (onProgress) onProgress(60);

  const unmetRequestIds = new Set(requests.map((r) => r.requestId));
  for (const route of routes) {
    for (const s of route.stops) {
      unmetRequestIds.delete(s.requestId);
    }
  }
  if (onProgress) onProgress(80);

  const scenarios: SimulationScenario[] = [];

  scenarios.push(
    buildScenarioFromRoutes(
      "scen-greedy",
      "Greedy Consolidation Plan",
      "Initial feasible plan using greedy insertion heuristic.",
      routes,
      config,
      Array.from(unmetRequestIds),
      true,
    ),
  );

  if (onProgress) onProgress(100);
  return scenarios;
};
