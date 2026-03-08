import api from "./api";
import type { User } from "../types/auth";

export const login = async (
  username?: string,
  password?: string,
): Promise<{ data: User; status: number }> => {
  sessionStorage.removeItem("user_data");
  sessionStorage.removeItem("auth_token");

  let response;
  if (username && password) {
    response = await api.post<User>("auth/login/external", {
      username,
      password,
    });
  } else {
    response = await api.get<User>("auth/login");
  }

  if (response.status === 200 && response.data) {
    if (response.data.jwt) {
      sessionStorage.setItem("auth_token", response.data.jwt);
    }
    sessionStorage.setItem("user_data", JSON.stringify(response.data));
  }

  return { data: response.data, status: response.status };
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const response = await api.post("auth/change-password", {
    currentPassword,
    newPassword,
  });
  return response.data;
};

export const logout = (): void => {
  sessionStorage.removeItem("user_data");
  sessionStorage.removeItem("auth_token");
};
