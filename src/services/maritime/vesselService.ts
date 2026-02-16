import api from "../api";
import type { Vessel } from "../../types/maritime/marine";

export const getVessels = async (category?: string): Promise<Vessel[]> => {
  const response = await api.get<Vessel[]>("vessels", {
    params: { category },
  });
  return response.data;
};

export const createVessel = async (vessel: Vessel): Promise<Vessel> => {
  const response = await api.post<Vessel>("vessels", vessel);
  return response.data;
};

export const updateVessel = async (vessel: Vessel): Promise<Vessel> => {
  const response = await api.put<Vessel>(`vessels/${vessel.vesselId}`, vessel);
  return response.data;
};

export const deleteVessel = async (
  id: string,
  reason: string,
): Promise<void> => {
  await api.delete(`vessels/${id}`, { data: { reason } });
};

export const getVesselCategories = async (): Promise<any[]> => {
  const response = await api.get("/vessels/categories");
  return response.data;
};
