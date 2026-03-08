import api from "../api";

export const approveRequest = async (
  requestId: string,
  comments: string = "",
  mode: "Marine" | "Aviation" = "Marine",
): Promise<any> => {
  const response = await api.post(
    `MovementRequests/${requestId}/approve`,
    JSON.stringify(comments), // Backend expects [FromBody] string, which is raw string but axios might wrap in quotes if we pass as string, or we can use JSON.stringify if it's treated as a JSON body that happens to be a string. Actually, [FromBody] string usually expects a quoted string if JSON.
    { params: { mode } },
  );
  return response.data;
};

export const rejectRequest = async (
  requestId: string,
  comments: string,
  mode: "Marine" | "Aviation" = "Marine",
): Promise<any> => {
  const response = await api.post(
    `MovementRequests/${requestId}/reject`,
    JSON.stringify(comments),
    { params: { mode } },
  );
  return response.data;
};
