import api from "../api";
import type { Location } from "../../types/maritime/logistics";
import { cache } from "../../utils/cache";

const LOCATIONS_CACHE_KEY = "maritime_locations";

export const getLocations = async (): Promise<Location[]> => {
  const cached = cache.get<Location[]>(LOCATIONS_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<Location[]>("locations");
  cache.set(LOCATIONS_CACHE_KEY, response.data);
  return response.data;
};

export const createLocation = async (location: Location): Promise<Location> => {
  const response = await api.post<Location>("locations", location);
  cache.remove(LOCATIONS_CACHE_KEY);
  return response.data;
};

export const updateLocation = async (location: Location): Promise<Location> => {
  const response = await api.put<Location>(
    `locations/${location.locationId}`,
    location,
  );
  cache.remove(LOCATIONS_CACHE_KEY);
  return response.data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`locations/${id}`);
  cache.remove(LOCATIONS_CACHE_KEY);
};
