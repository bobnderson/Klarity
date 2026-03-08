import api from "../api";
import type { MovementRequest } from "../../types/maritime/logistics";

export const marineMovementService = {
  async getMovementRequests(
    startDate?: string,
    endDate?: string,
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<MovementRequest[]> {
    const response = await api.get<MovementRequest[]>("MovementRequests", {
      params: { startDate, endDate, mode },
    });
    return response.data;
  },

  async getUnscheduledMovementRequests(
    accountId: string,
    page: number = 1,
    pageSize: number = 20,
    mode: "Marine" | "Aviation" = "Marine",
    startDate?: string,
    endDate?: string,
  ): Promise<{ items: MovementRequest[]; totalCount: number }> {
    const response = await api.get<{
      items: MovementRequest[];
      totalCount: number;
    }>(`MovementRequests/account/${accountId}`, {
      params: { page, pageSize, mode, startDate, endDate },
    });
    return response.data;
  },

  async searchMovementRequests(
    accountId: string,
    query: string,
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<{ items: MovementRequest[]; totalCount: number }> {
    const response = await api.get<{
      items: MovementRequest[];
      totalCount: number;
    }>(`MovementRequests/account/${accountId}/search`, {
      params: { query, mode },
    });
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
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<MovementRequest> {
    const response = await api.post<MovementRequest>(
      "MovementRequests",
      request,
      { params: { mode } },
    );
    return response.data;
  },

  async updateMovementRequest(
    requestId: string,
    updates: Partial<MovementRequest>,
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<MovementRequest> {
    const response = await api.put<MovementRequest>(
      `MovementRequests/${requestId}`,
      updates,
      { params: { mode } },
    );
    return response.data;
  },

  async deleteMovementRequest(
    requestId: string,
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<void> {
    await api.delete(`MovementRequests/${requestId}`, { params: { mode } });
  },

  async getPendingMovementRequests(filters?: {
    originId?: string;
    destinationId?: string;
    mode?: "Marine" | "Aviation";
  }): Promise<MovementRequest[]> {
    const response = await api.get<MovementRequest[]>(
      "MovementRequests/unscheduled",
      { params: filters },
    );
    return response.data;
  },
  async getPendingApprovals(
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<MovementRequest[]> {
    const response = await api.get<MovementRequest[]>(
      "MovementRequests/pending-approval",
      {
        params: { mode },
      },
    );
    return response.data;
  },

  async getApproverMapping(): Promise<any[]> {
    const response = await api.get<any[]>("MovementRequests/approvers/mapping");
    return response.data;
  },

  async downloadManifest(
    requestId: string,
    mode: "Marine" | "Aviation" = "Marine",
  ): Promise<void> {
    const response = await api.get(
      `MovementRequests/${requestId}/manifest/download`,
      {
        params: { mode },
        responseType: "blob",
      },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Manifest_${requestId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const getAllRequests = marineMovementService.getMovementRequests;
export const getRequestsByAccountId =
  marineMovementService.getUnscheduledMovementRequests;
export const searchRequests = marineMovementService.searchMovementRequests;
export const createRequest = marineMovementService.createMovementRequest;
export const updateRequest = marineMovementService.updateMovementRequest;
export const deleteRequest = marineMovementService.deleteMovementRequest;
export const getMovementRequestById =
  marineMovementService.getMovementRequestById;
export const getPendingRequests =
  marineMovementService.getPendingMovementRequests;
export const getPendingApprovals = marineMovementService.getPendingApprovals;
export const getApproverMapping = marineMovementService.getApproverMapping;
export const downloadManifest = marineMovementService.downloadManifest;
