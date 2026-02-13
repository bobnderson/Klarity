import api from "../api";
import type { MovementRequest } from "../../types/maritime/logistics";

export const marineMovementService = {
  async getMovementRequests(): Promise<MovementRequest[]> {
    const response = await api.get<MovementRequest[]>("MovementRequests");
    return response.data;
  },

  async getUnscheduledMovementRequests(
    accountId: string,
  ): Promise<MovementRequest[]> {
    const response = await api.get<MovementRequest[]>(
      `MovementRequests/account/${accountId}`,
    );
    return response.data;
  },

  async getMovementRequestById(requestId: string): Promise<MovementRequest> {
    const response = await api.get<MovementRequest>(
      `MovementRequests/${requestId}`,
    );
    return response.data;
  },

  async createMovementRequest(
    request: MovementRequest,
  ): Promise<MovementRequest> {
    const response = await api.post<MovementRequest>(
      "MovementRequests",
      request,
    );
    return response.data;
  },

  async updateMovementRequest(
    requestId: string,
    updates: Partial<MovementRequest>,
  ): Promise<MovementRequest> {
    const response = await api.put<MovementRequest>(
      `MovementRequests/${requestId}`,
      updates,
    );
    return response.data;
  },

  async deleteMovementRequest(requestId: string): Promise<void> {
    await api.delete(`MovementRequests/${requestId}`);
  },

  async getPendingMovementRequests(filters?: {
    originId?: string;
    destinationId?: string;
  }): Promise<MovementRequest[]> {
    const response = await api.get<MovementRequest[]>(
      "MovementRequests/unscheduled",
      { params: filters },
    );
    return response.data;
  },
};

export const getAllRequests = marineMovementService.getMovementRequests;
export const getRequestsByAccountId =
  marineMovementService.getUnscheduledMovementRequests;
export const createRequest = marineMovementService.createMovementRequest;
export const updateRequest = marineMovementService.updateMovementRequest;
export const deleteRequest = marineMovementService.deleteMovementRequest;
export const getPendingRequests =
  marineMovementService.getPendingMovementRequests;
