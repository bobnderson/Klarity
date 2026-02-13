export const CARGO_TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  cargo: { label: "Cargo", color: "#22c55e" },
  hazardous: { label: "Hazardous", color: "#f97316" },
  personnel: { label: "Personnel", color: "#38bdf8" },
};

export interface VoyageCargo {
  type: string;
  value: number; // percentage
}

export interface Voyage {
  voyageId: string;
  vesselId: string;
  vesselName: string;
  originId: string;
  originName?: string;
  destinationId: string;
  destinationName?: string;
  departureDateTime: string;
  eta: string;
  weightUtil: number;
  deckUtil: number;
  cabinUtil: number;
  statusId?: string;
  statusName?: string;
  statusColor?: string;
  tags?: string[];
  cargoDistribution: VoyageCargo[];
  stops?: VoyageStop[];
}

export interface VoyageStop {
  stopId: string;
  locationId: string;
  arrivalDateTime: string;
  departureDateTime: string;
  statusId?: string;
  statusName?: string;
}

export interface NewVoyage {
  vesselId: string;
  originId: string;
  destinationId: string;
  departureDateTime: string;
  eta: string;
  stops?: VoyageStop[];
}

export interface Vessel {
  vesselId?: string;
  vesselName: string;
  vesselTypeName?: string;
  statusId?: string;
  voyages: Voyage[];
  owner?: string;
  vesselTypeId?: string;
  vesselCategoryId?: string;
  capacities?: {
    fuelOil: number; // m3
    potableWater: number; // m3
    drillWater: number; // m3
    liquidMud: number; // m3
    dryBulkMud: number; // m3
    deadWeight: number; // tonnes
    deckArea: number; // m2
    deckLoading: number; // tonnes/m2
    totalComplement?: number; // pax
  };
  particulars?: {
    loa: number; // m
    lwl: number; // m
    breadthMoulded: number; // m
    depthMainDeck: number; // m
    designDraft: number; // m
  };
  performance?: {
    serviceSpeed: number; // knots
    maxSpeed: number; // knots
  };
  financials?: {
    hourlyOperatingCost: number;
    fuelConsumptionRate: number;
    mobilisationCost: number;
  };
}

export interface VesselCategory {
  categoryId: string;
  category: string;
  types: VesselTypeDefinition[];
}

export interface VesselTypeDefinition {
  categoryTypeId: string;
  categoryType: string;
}

export interface Route {
  routeId: string;
  route: string;
  waypoints: { lat: number; lng: number }[];
  status: "Active" | "Inactive" | "Planned";
  createdDate: string;
}

export interface VesselStatus {
  statusId: string;
  status: string;
}

export interface VoyageStatus {
  statusId: string;
  status: string;
}

export interface RequestLoad {
  requestId: string;
  originId: string;
  destinationId: string;
  earliestDeparture: string;
  latestDeparture: string;
  earliestArrival: string;
  latestArrival: string;
  urgencyScore: number;
  totalDeckArea: number;
  totalWeight: number;
  itemIds: string[];
  itemCount: number;
}

export interface VoyageCandidate {
  voyageId?: string;
  vesselId: string;
  vesselName?: string;
  originId: string;
  originName?: string;
  destinationId: string;
  destinationName?: string;
  departureTime: string;
  arrivalTime: string;
  assignedLoads: RequestLoad[];
  totalDeckUsed: number;
  totalWeightUsed: number;
  totalCost: number;
  utilisationPercent: number;
  estimatedSavings: number;
  totalItems: number;
  aggregatedItemIds: string[];
  assignedRequestIds: string[];
  score: number;
}
