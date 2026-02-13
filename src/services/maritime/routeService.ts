import api from "../api";
import type { Route } from "../../types/maritime/marine";
import { cache } from "../../utils/cache";

const ROUTES_CACHE_KEY = "maritime_routes";

export const getRoutes = async (): Promise<Route[]> => {
  const cached = cache.get<Route[]>(ROUTES_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<any[]>("locations");
  const routes = response.data.map((loc) => ({
    routeId: loc.locationId,
    route: loc.locationName,
    waypoints:
      loc.latitude && loc.longitude
        ? [{ lat: loc.latitude, lng: loc.longitude }]
        : [],
    status: "Active" as "Active" | "Inactive" | "Planned",
    createdDate: new Date().toISOString(),
  }));
  cache.set(ROUTES_CACHE_KEY, routes);
  return routes;
};

export const getRouteById = async (id: string): Promise<Route | undefined> => {
  const response = await api.get<Route>(`/routes/${id}`);
  return response.data;
};

export const createRoute = async (route: Route): Promise<Route> => {
  const response = await api.post<Route>("/routes", route);
  return response.data;
};

export const updateRoute = async (route: Route): Promise<Route> => {
  const response = await api.put<Route>(`/routes/${route.routeId}`, route);
  return response.data;
};

export const deleteRoute = async (
  id: string,
  reason: string,
): Promise<void> => {
  await api.delete(`/routes/${id}`, { data: { reason } });
};
