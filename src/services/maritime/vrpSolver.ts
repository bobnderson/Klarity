// src/services/maritime/vrpSolver.ts

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Stop extends Location {
  activity: "Load" | "Unload";
  duration: number; // hours
  demandWeight: number;
}

export interface Vessel {
  id: string;
  name: string;
  type: string;
  maxWeightCapacity: number;
  cruisingSpeed: number; // knots
  hourlyOperatingCost: number;
  currentLocation?: { lat: number; lng: number };
}

export interface VesselRoute {
  vesselId: string;
  vesselName: string;
  stops: (Stop & { arrivalTime: string; departureTime: string })[];
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  path: { lat: number; lng: number }[];
}

function calculateDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number },
): number {
  const R = 3440.065; // Nautical miles
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLng = (loc2.lng - loc1.lng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function solveVRP(
  vessels: Vessel[],
  stops: Stop[],
  options: {
    speedMultiplier?: number;
    startTime?: string;
    startLocation?: { lat: number; lng: number };
  } = {},
): VesselRoute[] {
  const {
    speedMultiplier = 1,
    startTime = new Date().toISOString(),
    startLocation = { lat: 43.2965, lng: 5.3698 },
  } = options;

  const routes: VesselRoute[] = [];
  const unassignedStops = [...stops];

  vessels.forEach((vessel) => {
    if (unassignedStops.length === 0) return;

    const vesselStops: any[] = [];
    let currentPos = vessel.currentLocation || startLocation;
    let currentTime = new Date(startTime);
    let totalDist = 0;
    let currentWeight = 0;
    const path: { lat: number; lng: number }[] = [currentPos];

    while (unassignedStops.length > 0) {
      let nearestIdx = -1;
      let minDist = Infinity;

      for (let i = 0; i < unassignedStops.length; i++) {
        const stop = unassignedStops[i];
        if (currentWeight + stop.demandWeight <= vessel.maxWeightCapacity) {
          const dist = calculateDistance(currentPos, stop);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }
      }

      if (nearestIdx === -1) break;

      const stop = unassignedStops.splice(nearestIdx, 1)[0];
      const travelTime = minDist / (vessel.cruisingSpeed * speedMultiplier);
      const arrival = new Date(currentTime.getTime() + travelTime * 3600000);
      const departure = new Date(arrival.getTime() + stop.duration * 3600000);

      vesselStops.push({
        ...stop,
        arrivalTime: arrival.toISOString(),
        departureTime: departure.toISOString(),
      });
      totalDist += minDist;
      currentPos = { lat: stop.lat, lng: stop.lng };
      currentTime = departure;
      currentWeight += stop.demandWeight;
      path.push(currentPos);
    }

    if (vesselStops.length > 0) {
      // Add return to port
      const distToPort = calculateDistance(currentPos, startLocation);
      const returnTime = distToPort / (vessel.cruisingSpeed * speedMultiplier);
      const finalTime = new Date(currentTime.getTime() + returnTime * 3600000);
      totalDist += distToPort;
      path.push(startLocation);

      const totalDuration =
        (finalTime.getTime() - new Date(startTime).getTime()) / 3600000;
      routes.push({
        vesselId: vessel.id,
        vesselName: vessel.name,
        stops: vesselStops,
        totalDistance: totalDist,
        totalDuration,
        totalCost: totalDuration * vessel.hourlyOperatingCost + totalDist * 10, // Simplistic fuel cost
        path,
      });
    }
  });

  return routes;
}
