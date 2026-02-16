import api from "../api";
import type { FlightSchedule } from "../../types/maritime/logistics";

export const getFlightSchedules = async (): Promise<FlightSchedule[]> => {
  const response = await api.get<FlightSchedule[]>("/FlightSchedules");
  return response.data;
};

export const getFlightScheduleById = async (
  id: string,
): Promise<FlightSchedule> => {
  const response = await api.get<FlightSchedule>(`/FlightSchedules/${id}`);
  return response.data;
};

export const createFlightSchedule = async (
  schedule: FlightSchedule,
): Promise<FlightSchedule> => {
  const response = await api.post<FlightSchedule>("/FlightSchedules", schedule);
  return response.data;
};

export const updateFlightSchedule = async (
  id: string,
  schedule: FlightSchedule,
): Promise<void> => {
  await api.put(`/FlightSchedules/${id}`, schedule);
};

export const deleteFlightSchedule = async (id: string): Promise<void> => {
  await api.delete(`/FlightSchedules/${id}`);
};
