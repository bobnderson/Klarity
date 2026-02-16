import axios from "axios";

const API_BASE_URL = "/api/MovementRequests";

export const approveRequest = async (requestId: string): Promise<any> => {
  const response = await axios.post(`${API_BASE_URL}/${requestId}/approve`);
  return response.data;
};

export const rejectRequest = async (
  requestId: string,
  comments: string,
): Promise<any> => {
  const response = await axios.post(`${API_BASE_URL}/${requestId}/reject`, {
    comments,
  });
  return response.data;
};
