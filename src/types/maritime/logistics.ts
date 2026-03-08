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
  containerId?: string;
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
  validationErrors?: Record<string, boolean>;
}

export interface FlatCargoItem extends MovementRequestItem {
  requestId: string;
  origin: string;
  destination: string;
  earliestDeparture: string;
  latestArrival: string;
  urgency: string;
  parentIsHazardous: boolean;
  businessUnitName: string;
  requestDate: string;
  voyageStatus?: string;
  voyageStatusColor?: string;
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
  businessUnitName?: string;
  costCentre?: string;
  costCentreName?: string;
  comments?: string;
  notify?: string[]; // Array of user IDs or emails

  // Aviation Selection & Approval
  tripType?: "OneWay" | "RoundTrip";
  selectedVoyageId?: string;
  returnVoyageId?: string;
  approverId?: string;
  approvedAt?: string;
  approverComments?: string;
  returnEarliestDeparture?: string;
  returnLatestArrival?: string;
  scheduledDeparture?: string;
  scheduledArrival?: string;
  returnScheduledDeparture?: string;
  returnScheduledArrival?: string;
  vesselName?: string;
  transportationMode?: "Marine" | "Aviation";

  // Properties that might be calculated or aggregated
  totalWeight?: number;
  totalDeckArea?: number;
  dimension?: string; // Aggregated dimension string if needed for UI
}

export interface FlightSchedule {
  scheduleId?: string;
  helicopterId: string;
  helicopterName?: string;
  originId: string;
  originName?: string;
  destinationId: string;
  destinationName?: string;
  departureTime: string; // "HH:mm:ss"
  durationMinutes: number;
  frequency: "Daily" | "Weekly" | "Monthly";
  daysOfWeek?: string; // "Mon,Wed,Fri"
  dayOfMonth?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PredefinedContainer {
  containerId: string;
  name: string;
  vesselId: string;
  description?: string;
  length: number;
  width: number;
  height: number;
  dimensionUnit: string;
  maxWeight: number;
  weightUnit: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  isActive: boolean;
}
