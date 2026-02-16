import api from "../api";
import type { Helicopter } from "../../types/maritime/marine";

export const getHelicopters = async (
  statusId?: string,
): Promise<Helicopter[]> => {
  const response = await api.get<Helicopter[]>("helicopters", {
    params: { statusId },
  });
  return response.data;
};

export const getHelicopterById = async (id: string): Promise<Helicopter> => {
  const response = await api.get<Helicopter>(`helicopters/${id}`);
  return response.data;
};

export const createHelicopter = async (
  helicopter: Helicopter,
): Promise<Helicopter> => {
  const response = await api.post<Helicopter>("helicopters", helicopter);
  return response.data;
};

export const updateHelicopter = async (
  id: string,
  helicopter: Helicopter,
): Promise<void> => {
  await api.put(`helicopters/${id}`, helicopter);
};

export const deleteHelicopter = async (id: string): Promise<void> => {
  await api.delete(`helicopters/${id}`);
};
