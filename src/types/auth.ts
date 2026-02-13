export interface MenuItemConfig {
  label: string;
  path?: string;
  children?: { label: string; path: string }[];
}

export interface UserRole {
  roleId: string;
  roleName: string;
}

export interface User {
  accountId: string;
  accountName: string;
  roles: UserRole[];
  lastLogin: string;
  menus: MenuItemConfig[];
  jwt?: string;
}
