import api from "../api";
import type { PredefinedContainer } from "../../types/maritime/logistics";

export const containerService = {
  getContainers: async (): Promise<PredefinedContainer[]> => {
    const response = await api.get("/Containers");
    return response.data;
  },

  getContainer: async (id: string): Promise<PredefinedContainer> => {
    const response = await api.get(`/Containers/${id}`);
    return response.data;
  },

  createContainer: async (
    container: Partial<PredefinedContainer>,
  ): Promise<PredefinedContainer> => {
    const response = await api.post("/Containers", container);
    return response.data;
  },

  updateContainer: async (
    id: string,
    container: PredefinedContainer,
  ): Promise<void> => {
    await api.put(`/Containers/${id}`, container);
  },

  deleteContainer: async (id: string): Promise<void> => {
    await api.delete(`/Containers/${id}`);
  },
};
