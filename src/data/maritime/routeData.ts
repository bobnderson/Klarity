import type { Route } from "../../types/maritime/marine";

export const MOCK_ROUTES: Route[] = [
  {
    routeId: "r001",
    route: "Bonga",
    status: "Active",
    createdDate: "2024-01-15T08:00:00Z",
    waypoints: [
      { lat: 28.5, lng: -90.5 },
      { lat: 28.8, lng: -91.2 },
      { lat: 29.1, lng: -91.8 },
    ],
  },
  {
    routeId: "r002",
    route: "Ladol",
    status: "Active",
    createdDate: "2024-02-10T09:30:00Z",
    waypoints: [
      { lat: 27.8, lng: -89.4 },
      { lat: 28.2, lng: -89.9 },
      { lat: 28.6, lng: -90.3 },
    ],
  },
  {
    routeId: "r003",
    route: "Onne",
    status: "Planned",
    createdDate: "2024-03-05T14:15:00Z",
    waypoints: [
      { lat: 26.5, lng: -92.0 },
      { lat: 27.0, lng: -92.5 },
    ],
  },
  {
    routeId: "r004",
    route: "Tincan",
    status: "Inactive",
    createdDate: "2023-11-20T11:00:00Z",
    waypoints: [
      { lat: 29.5, lng: -88.0 },
      { lat: 29.8, lng: -88.5 },
    ],
  },
];
