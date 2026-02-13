// types/maritime/simulation.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SimulationRequest {
  requestId: string;
  pickupLocation: Coordinates;
  dropoffLocation: Coordinates;
  cargoWeight?: number; // tonnes
  cargoVolume?: number; // m3
  deckSpaceRequired?: number; // m2
  cargoDimensions?: { length: number; width: number; height: number };
  hazardClass?: string;
  urgencyLevel: "critical" | "high" | "medium" | "low";
  earliestPickupTime: string; // ISO
  latestDropoffTime: string; // ISO
  loadingDuration: number; // hours
  unloadingDuration: number; // hours
  earlyMobilisationRequired: boolean;
  requiresSpecialHandling: boolean;
  personnelCount?: number;
}

export interface SimulationVessel {
  vesselId: string;
  vesselName: string;
  vesselType: "PSV" | "AHTS" | "Crew Boat" | "Barge" | "Heavy Lift";
  currentLocation: Coordinates;
  availableFromTime: string; // ISO
  maxWeightCapacity: number; // tonnes
  maxDeckSpace: number; // m2
  maxVolumeCapacity: number; // m3
  fuelConsumptionRate: number; // liters/hour
  cruisingSpeed: number; // knots
  mobilisationCost: number; // USD
  hourlyOperatingCost: number; // USD
  maxStopsAllowed: number;
  weatherToleranceLevel: "Low" | "Medium" | "High";
}

export interface SimulationConfig {
  weatherDelayFactor: number; // 0.0 - 1.0 (1.0 = no delay)
  vesselSpeedMultiplier: number; // 0.5 - 1.5
  emergencyCargoPriorityBoost: number; // Multiplier for urgent cargo score
  earlyMobilisationWeight: number; // Penalty weight
  fuelCostPerLiter: number; // USD
  maxRouteDistance: number; // nm
  maxVoyageDuration: number; // hours
  portCongestionDelay: number; // hours
}

export interface SimulationStop {
  locationId: string;
  locationName: string;
  arrival: string;
  departure: string;
  activity: "Load" | "Discharge" | "Refuel";
}

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  isOptimal: boolean;
  score: number; // 0-100
  cost: number;
  timeHours: number;
  vesselId: string;
  vesselName: string;
  stops: SimulationStop[];
  path: { lat: number; lng: number }[];
}
