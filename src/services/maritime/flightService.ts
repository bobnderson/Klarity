import api from "../api";
import type { VoyageCandidate } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";
import type { Flight } from "../../types/aviation/flight";

export const getFlights = async (): Promise<Flight[]> => {
  const response = await api.get<Flight[]>("flights");
  return response.data;
};

export const getFlightById = async (flightId: string): Promise<Flight> => {
  const response = await api.get<Flight>(`flights/${flightId}`);
  return response.data;
};

export const getFlightsByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<Flight[]> => {
  const response = await api.get<Flight[]>("flights/date-range", {
    params: { startDate, endDate },
  });
  return response.data;
};

export const searchFlights = async (
  originId: string,
  destinationId: string,
  travelDate: string,
  paxCount: number = 1,
): Promise<Flight[]> => {
  const response = await api.get<Flight[]>("flights/search", {
    params: { originId, destinationId, travelDate, paxCount },
  });
  return response.data;
};

export const createFlight = async (
  flightData: Partial<Flight>,
): Promise<Flight> => {
  const response = await api.post<Flight>("flights", flightData);
  return response.data;
};

export const updateFlight = async (flight: Flight): Promise<Flight> => {
  const response = await api.put<Flight>(`flights/${flight.flightId}`, flight);
  return response.data;
};

export const deleteFlight = async (flightId: string): Promise<void> => {
  await api.delete(`flights/${flightId}`);
};

export const getFlightManifest = async (
  flightId: string,
): Promise<MovementRequest[]> => {
  const response = await api.get<MovementRequest[]>(
    `flights/${flightId}/manifest`,
  );
  return response.data;
};

export const assignItemsToFlight = async (
  flightId: string,
  itemIds: string[],
): Promise<{ success: boolean }> => {
  await api.post(`/flights/${flightId}/assign-items`, {
    itemIds,
  });
  return { success: true };
};

export const unassignItemsFromFlight = async (
  flightId: string,
  itemIds: string[],
): Promise<{ success: boolean }> => {
  await api.post(`/flights/${flightId}/unassign-items`, {
    itemIds,
  });
  return { success: true };
};

export const optimizeFlights = async (): Promise<VoyageCandidate[]> => {
  const response = await api.post<VoyageCandidate[]>("flights/optimize");
  return response.data;
};
