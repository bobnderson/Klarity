export interface RequestType {
  requestTypeId: string;
  requestType: string;
}

export const REQUEST_TYPES: RequestType[] = [
  { requestTypeId: "req-001", requestType: "Offshore Delivery" },
  { requestTypeId: "req-002", requestType: "Backhaul" },
  { requestTypeId: "req-003", requestType: "In Field Transfer" },
  { requestTypeId: "req-004", requestType: "Vendor to Vendor" },
];

export interface BusinessUnit {
  unitId: string;
  unitName: string;
  costCentres: CostCentre[];
}

export interface CostCentre {
  code: string;
  name: string;
}

export const BUSINESS_UNITS: BusinessUnit[] = [
  {
    unitId: "bu-001",
    unitName: "Upstream Nigeria",
    costCentres: [
      { code: "CC-101", name: "Exploration - 101" },
      { code: "CC-102", name: "Production - 102" },
    ],
  },
  {
    unitId: "bu-002",
    unitName: "Deepwater Operations",
    costCentres: [
      { code: "CC-201", name: "Bonga Operations - 201" },
      { code: "CC-202", name: "Maintenance - 202" },
    ],
  },
  {
    unitId: "bu-003",
    unitName: "Logistics Services",
    costCentres: [
      { code: "CC-301", name: "Marine Logistics - 301" },
      { code: "CC-302", name: "Aviation - 302" },
    ],
  },
];

export const MOCK_VESSELS = [
  {
    vesselId: "v1",
    vesselName: "African Inspiration",
    vesselType: "PSV",
    currentLocation: { lat: 4.5, lng: 7.0 },
    availableFromTime: new Date().toISOString(),
    maxWeightCapacity: 3000,
    cruisingSpeed: 12,
    hourlyOperatingCost: 500,
    fuelConsumptionRate: 100,
    maxDeckSpace: 800,
    maxVolumeCapacity: 2000,
    maxStopsAllowed: 5,
    weatherToleranceLevel: "High",
  },
  {
    vesselId: "v2",
    vesselName: "Bourbon Liberty",
    vesselType: "AHTS",
    currentLocation: { lat: 6.4, lng: 3.4 },
    availableFromTime: new Date().toISOString(),
    maxWeightCapacity: 1200,
    cruisingSpeed: 14,
    hourlyOperatingCost: 800,
    fuelConsumptionRate: 150,
    maxDeckSpace: 400,
    maxVolumeCapacity: 1000,
    maxStopsAllowed: 4,
    weatherToleranceLevel: "Medium",
  },
  {
    vesselId: "v3",
    vesselName: "Fast Crew Supplier 1",
    vesselType: "Crew Boat",
    currentLocation: { lat: 5.0, lng: 5.0 },
    availableFromTime: new Date().toISOString(),
    maxWeightCapacity: 150,
    cruisingSpeed: 25,
    hourlyOperatingCost: 1200,
    fuelConsumptionRate: 200,
    maxDeckSpace: 100,
    maxVolumeCapacity: 50,
    maxStopsAllowed: 6,
    weatherToleranceLevel: "Low",
  },
];

export interface AdUser {
  id: string;
  displayName: string;
  email: string;
  department: string;
}

export const MOCK_AD_USERS: AdUser[] = [
  {
    id: "user-001",
    displayName: "Bobby Ekpo",
    email: "b.ekpo@shell.com",
    department: "Logistics",
  },
  {
    id: "user-002",
    displayName: "Jason Statham",
    email: "j.statham@shell.com",
    department: "Operations",
  },
  {
    id: "user-003",
    displayName: "Vin Diesel",
    email: "v.diesel@shell.com",
    department: "Transport",
  },
  {
    id: "user-004",
    displayName: "Michelle Rodriguez",
    email: "m.rodriguez@shell.com",
    department: "Safety",
  },
  {
    id: "user-005",
    displayName: "Dwayne Johnson",
    email: "d.johnson@shell.com",
    department: "Security",
  },
];
