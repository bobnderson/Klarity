export interface Flight {
  flightId: string;
  helicopterId: string;
  helicopterName?: string;
  originId: string;
  originName?: string;
  destinationId: string;
  destinationName?: string;
  departureDateTime: string;
  arrivalDateTime: string;
  payloadUtil: number;
  cabinUtil: number;
  statusId?: string;
  statusName?: string;
  costPerPax: number;
  paxCapacity: number;
  paxCurrent: number;
  isDeleted: boolean;
  stops: FlightStop[];
  cargoDistribution: FlightCargoDistribution[];
}

export interface FlightStop {
  stopId: string;
  flightId: string;
  locationId: string;
  locationName?: string;
  arrivalDateTime: string;
  departureDateTime: string;
  statusId?: string;
  statusName?: string;
}

export interface FlightCargoDistribution {
  type: string;
  value: number;
}
