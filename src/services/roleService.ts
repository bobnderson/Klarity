import api from "./api";

export interface Role {
  roleId: string;
  roleName: string;
  description?: string;
  menuItemIds: string[];
  isActive?: boolean;
}

export interface MenuItemOption {
  menuItemId: string;
  itemLabel: string;
  groupLabel: string;
}

export interface CreateRoleDto {
  roleName: string;
  description?: string;
  menuItemIds: string[];
  isActive?: boolean;
}

export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get<Role[]>("/roles");
  return response.data;
};

export const getRole = async (id: string): Promise<Role> => {
  const response = await api.get<Role>(`/roles/${id}`);
  return response.data;
};

export const getMenuItems = async (): Promise<MenuItemOption[]> => {
  const response = await api.get<MenuItemOption[]>("/roles/menu-items");
  return response.data;
};

export const createRole = async (role: CreateRoleDto): Promise<Role> => {
  const response = await api.post<Role>("/roles", role);
  return response.data;
};

export const updateRole = async (id: string, role: Role): Promise<void> => {
  await api.put(`/roles/${id}`, role);
};

export const deleteRole = async (id: string): Promise<void> => {
  await api.delete(`/roles/${id}`);
};
