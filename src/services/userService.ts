import api from "./api";

export interface User {
  accountId: string;
  accountName: string;
  lastLogin?: string;
  isActive: boolean;
  roleIds: string[];
}

export interface AdUser {
  samAccountName: string;
  displayName: string;
  email: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<User[]>("/users");
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (user: User): Promise<User> => {
  const response = await api.post<User>("/users", user);
  return response.data;
};

export const updateUser = async (id: string, user: User): Promise<void> => {
  await api.put(`/users/${id}`, user);
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}`);
};

export const searchAdUsers = async (query: string): Promise<AdUser[]> => {
  const response = await api.get<AdUser[]>("/users/search-ad", {
    params: { query },
  });
  return response.data;
};
