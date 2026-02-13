import type { MenuItemConfig } from "../types/auth";

export const MENU_CONFIG: MenuItemConfig[] = [
  {
    label: "Marine",
    children: [
      { label: "Vessels", path: "/marine-vessels" },
      { label: "Marine Planner", path: "/marine-planner" },
      { label: "Marine Request", path: "/marine-request" },
      { label: "Cargo Manifest", path: "/cargo-manifest" },
      { label: "Vessel Scheduling", path: "/vessel-scheduling" },
    ],
  },
  {
    label: "Aviation",
    children: [
      { label: "Flight Request", path: "/aviation-request" },
      { label: "Aviation Planner", path: "/aviation-planner" },
    ],
  },
  {
    label: "Settings",
    children: [
      { label: "Users", path: "/settings-users" },
      { label: "Roles", path: "/settings-roles" },
      { label: "System Settings", path: "/settings-smtp" },
    ],
  },
];

export const MOCK_USER = {
  accountId: "bobby.ekpo",
  accountName: "Ekpo, Bobby",
  roles: [
    { roleId: "lc-01", roleName: "Logistics Coordinator" },
    { roleId: "admin-01", roleName: "System Administrator" },
  ],
  lastLogin: new Date().toISOString(),
  menus: MENU_CONFIG,
};
