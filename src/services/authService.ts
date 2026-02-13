import api from "./api";
import type { User } from "../types/auth";

export const login = async (
  email?: string,
  password?: string,
): Promise<{ data: User; status: number }> => {
  // Clear any existing session at the start
  sessionStorage.removeItem("user_data");
  sessionStorage.removeItem("auth_token");

  const response = await api.get<User>("auth/login", {
    params: email ? { email, password } : {},
  });

  if (response.status === 200 && response.data) {
    if (response.data.jwt) {
      sessionStorage.setItem("auth_token", response.data.jwt);
    }
    sessionStorage.setItem("user_data", JSON.stringify(response.data));
  }

  return { data: response.data, status: response.status };
};

export const logout = (): void => {
  sessionStorage.removeItem("user_data");
  sessionStorage.removeItem("auth_token");
};
