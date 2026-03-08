import api from "../api";
import type {
  NewVoyage,
  Voyage,
  VoyageCandidate,
  VoyageSchedule,
} from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";

export const getVoyages = async (): Promise<Voyage[]> => {
  const response = await api.get<Voyage[]>("voyages");
  return response.data;
};

export const getVoyagesByVesselId = async (
  vesselId: string,
): Promise<Voyage[]> => {
  const response = await api.get<Voyage[]>(`vessels/${vesselId}/voyages`);
  return response.data;
};

export const getVoyagesByDateRange = async (
  startDate: string,
  endDate: string,
): Promise<Voyage[]> => {
  const response = await api.get<Voyage[]>("voyages/date-range", {
    params: { startDate, endDate },
  });
  return response.data;
};

export const updateVoyage = async (voyage: Voyage): Promise<Voyage> => {
  const response = await api.put<Voyage>(`voyages/${voyage.voyageId}`, voyage);
  return response.data;
};

export const deleteVoyage = async (voyageId: string): Promise<void> => {
  await api.delete(`voyages/${voyageId}`);
};

export const createVoyage = async (voyageData: NewVoyage): Promise<Voyage> => {
  const response = await api.post<Voyage>("voyages", voyageData);
  return response.data;
};

export const assignItemsToVoyage = async (
  voyageId: string,
  itemIds: string[],
): Promise<{ success: boolean }> => {
  await api.post(`/voyages/${voyageId}/assign-items`, {
    itemIds,
  });
  return { success: true };
};

export const unassignItemsFromVoyage = async (
  voyageId: string,
  itemIds: string[],
): Promise<{ success: boolean }> => {
  await api.post(`/voyages/${voyageId}/unassign-items`, {
    itemIds,
  });
  return { success: true };
};

export const getVoyageManifest = async (
  voyageId: string,
): Promise<MovementRequest[]> => {
  const response = await api.get<MovementRequest[]>(
    `voyages/${voyageId}/manifest`,
  );
  return response.data;
};

export const optimizeVoyagePlan = async (): Promise<VoyageCandidate[]> => {
  const response = await api.post<VoyageCandidate[]>("voyages/optimize");
  return response.data;
};

export const createVoyageSchedule = async (
  schedule: VoyageSchedule,
): Promise<VoyageSchedule> => {
  const response = await api.post<VoyageSchedule>("voyageSchedules", schedule);
  return response.data;
};

export const getVoyageSchedules = async (): Promise<VoyageSchedule[]> => {
  const response = await api.get<VoyageSchedule[]>("voyageSchedules");
  return response.data;
};

export const updateVoyageSchedule = async (
  schedule: VoyageSchedule,
): Promise<void> => {
  await api.put(`voyageSchedules/${schedule.scheduleId}`, schedule);
};

export const deleteVoyageSchedule = async (id: string): Promise<void> => {
  await api.delete(`voyageSchedules/${id}`);
};
