export interface ItemCategoryOption {
  categoryId: string;
  categoryName: string;
}

export interface ItemTypeOption {
  typeId: string;
  categoryId: string;
  typeName: string;
}

export interface UrgencyOption {
  urgencyId: string;
  urgencyLabel: string;
  displayOrder: number;
}

export interface UnitOfMeasurementOption {
  unitId: string;
  unitLabel: string;
}

export interface DimensionUnitOption {
  unitId: string;
  unitLabel: string;
}

export interface WeightUnitOption {
  unitId: string;
  unitLabel: string;
}

export interface RequestTypeOption {
  requestTypeId: string;
  requestType: string;
}

export interface BusinessUnitOption {
  businessUnitId: string;
  businessUnit: string;
  costCentres: CostCentreOption[];
}

export interface Location {
  locationId: string;
  locationName: string;
  locationType: string;
  latitude?: number;
  longitude?: number;
}

export interface CostCentreOption {
  code: string;
  name: string;
}

export interface MovementRequestItem {
  itemId: string;
  categoryId: string;
  itemTypeId: string;
  quantity: number;
  unitOfMeasurement: string;
  description?: string;
  dimensions?: string; // L x W x H
  dimensionUnit?: string;
  volume?: number;
  weight?: number; // value
  weightUnit?: string;
  assignedVoyageId?: string;
  status?: "Draft" | "Pending" | "Manifested" | "InTransit" | "Delivered";
  isHazardous?: boolean;
  itemTypeName?: string;
}

export interface MovementRequest {
  requestId: string;
  requestDate?: string;
  status:
    | "Draft"
    | "Pending"
    | "Approved"
    | "Rejected"
    | "PartiallyScheduled"
    | "Scheduled";
  scheduleIndicator: "Scheduled" | "Unscheduled";
  originId: string;
  originName?: string;
  destinationId: string;
  destinationName?: string;
  earliestDeparture: string; // ISO DateTime
  latestDeparture?: string; // ISO DateTime
  earliestArrival?: string; // ISO DateTime
  latestArrival: string; // ISO DateTime
  items: MovementRequestItem[];
  requestedBy?: string;
  urgencyId: string;
  urgency?: string;
  isHazardous: boolean;

  // New Fields
  requestTypeId?: string;
  requestType?: string;
  transportationRequired?: boolean;
  lifting?: "Normal" | "Complex" | string;
  businessUnitId?: string;
  costCentre?: string;
  costCentreName?: string;
  comments?: string;
  notify?: string[]; // Array of user IDs or emails

  // Properties that might be calculated or aggregated
  totalWeight?: number;
  totalDeckArea?: number;
  dimension?: string; // Aggregated dimension string if needed for UI
}
