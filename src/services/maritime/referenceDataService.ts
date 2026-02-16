import api from "../api";
import type {
  UrgencyOption,
  UnitOfMeasurementOption,
  RequestTypeOption,
  BusinessUnitOption,
  ItemCategoryOption,
  ItemTypeOption,
  DimensionUnitOption,
  WeightUnitOption,
} from "../../types/maritime/logistics";
import { cache } from "../../utils/cache";

const UNITS_CACHE_KEY = "maritime_units";
const URGENCY_CACHE_KEY = "maritime_urgency";
const REQUEST_TYPE_CACHE_KEY = "maritime_request_types";
const BUSINESS_UNIT_CACHE_KEY = "maritime_business_units";
const VESSEL_STATUS_CACHE_KEY = "maritime_vessel_statuses";
const VOYAGE_STATUS_CACHE_KEY = "maritime_voyage_statuses";
const ITEM_CATEGORY_CACHE_KEY = "maritime_item_categories";
const ITEM_TYPE_CACHE_KEY = "maritime_item_types";
const DIMENSION_UNITS_CACHE_KEY = "maritime_dimension_units";
const WEIGHT_UNITS_CACHE_KEY = "maritime_weight_units";

export const getUnits = async (): Promise<UnitOfMeasurementOption[]> => {
  const cached = cache.get<UnitOfMeasurementOption[]>(UNITS_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<UnitOfMeasurementOption[]>(
    "MovementRequests/units",
  );
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(UNITS_CACHE_KEY, data);
  return data;
};

export const getDimensionUnits = async (): Promise<string[]> => {
  const cached = cache.get<string[]>(DIMENSION_UNITS_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<DimensionUnitOption[]>(
    "MovementRequests/dimension-units",
  );
  const labels = Array.isArray(response.data)
    ? response.data.map((u) => u.unitLabel)
    : [];
  cache.set(DIMENSION_UNITS_CACHE_KEY, labels);
  return labels;
};

export const getWeightUnits = async (): Promise<string[]> => {
  const cached = cache.get<string[]>(WEIGHT_UNITS_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<WeightUnitOption[]>(
    "MovementRequests/weight-units",
  );
  const labels = Array.isArray(response.data)
    ? response.data.map((u) => u.unitLabel)
    : [];
  cache.set(WEIGHT_UNITS_CACHE_KEY, labels);
  return labels;
};

export const getVolumeUnits = async (): Promise<string[]> => {
  return getDimensionUnits();
};

export const getUrgencyOptions = async (): Promise<UrgencyOption[]> => {
  const cached = cache.get<UrgencyOption[]>(URGENCY_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<UrgencyOption[]>("MovementRequests/urgencies");
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(URGENCY_CACHE_KEY, data);
  return data;
};

export const getRequestTypes = async (
  mode: string = "Marine",
): Promise<RequestTypeOption[]> => {
  const cacheKey = `${REQUEST_TYPE_CACHE_KEY}_${mode}`;
  const cached = cache.get<RequestTypeOption[]>(cacheKey);
  if (cached) return cached;

  const response = await api.get<RequestTypeOption[]>(
    `MovementRequests/request-types?mode=${mode}`,
  );
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(cacheKey, data);
  return data;
};

export const getBusinessUnits = async (): Promise<BusinessUnitOption[]> => {
  const cached = cache.get<BusinessUnitOption[]>(BUSINESS_UNIT_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<BusinessUnitOption[]>(
    "MovementRequests/business-units",
  );
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(BUSINESS_UNIT_CACHE_KEY, data);
  return data;
};

export const getVesselStatuses = async (): Promise<any[]> => {
  const cached = cache.get<any[]>(VESSEL_STATUS_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<any[]>("vessels/statuses");
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(VESSEL_STATUS_CACHE_KEY, data);
  return data;
};

export const getVoyageStatuses = async (): Promise<any[]> => {
  const cached = cache.get<any[]>(VOYAGE_STATUS_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<any[]>("voyages/statuses");
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(VOYAGE_STATUS_CACHE_KEY, data);
  return data;
};

export const getItemCategories = async (): Promise<ItemCategoryOption[]> => {
  const cached = cache.get<ItemCategoryOption[]>(ITEM_CATEGORY_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<ItemCategoryOption[]>(
    "MovementRequests/item-categories",
  );
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(ITEM_CATEGORY_CACHE_KEY, data);
  return data;
};

export const getItemTypes = async (): Promise<ItemTypeOption[]> => {
  const cached = cache.get<ItemTypeOption[]>(ITEM_TYPE_CACHE_KEY);
  if (cached) return cached;

  const response = await api.get<ItemTypeOption[]>(
    "MovementRequests/item-types",
  );
  const data = Array.isArray(response.data) ? response.data : [];
  cache.set(ITEM_TYPE_CACHE_KEY, data);
  return data;
};

// Keeping this for backward compatibility if needed by other components
export const getPriorityOptions = async (): Promise<string[]> => {
  const urgencies = await getUrgencyOptions();
  return urgencies.map((u) => u.urgencyLabel);
};

export const clearReferenceDataCache = () => {
  cache.remove(UNITS_CACHE_KEY);
  cache.remove(URGENCY_CACHE_KEY);
  cache.remove(REQUEST_TYPE_CACHE_KEY);
  cache.remove(BUSINESS_UNIT_CACHE_KEY);
  cache.remove(VESSEL_STATUS_CACHE_KEY);
  cache.remove(VOYAGE_STATUS_CACHE_KEY);
  cache.remove(ITEM_CATEGORY_CACHE_KEY);
  cache.remove(ITEM_TYPE_CACHE_KEY);
  cache.remove(DIMENSION_UNITS_CACHE_KEY);
  cache.remove(WEIGHT_UNITS_CACHE_KEY);
};
