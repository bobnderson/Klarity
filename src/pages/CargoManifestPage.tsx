import { useState, useEffect } from "react";
import { Box, LinearProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { MarineHeader } from "../components/maritime/MarineHeader";
import { getVessels } from "../services/maritime/vesselService";
import { getAllRequests } from "../services/maritime/marineMovementService";
import type { Vessel } from "../types/maritime/marine";
import type {
  MovementRequest,
  BusinessUnitOption,
  FlatCargoItem,
} from "../types/maritime/logistics";
import { getBusinessUnits } from "../services/maritime/referenceDataService";
import { toast } from "react-toastify";
import { CargoManifestStats } from "../components/manifests/CargoManifestStats";
import { CargoManifestTable } from "../components/manifests/CargoManifestTable";

export function CargoManifestPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>([]);
  const [routeFilters, setRouteFilters] = useState<
    Array<{ origin: string | null; destination: string | null }>
  >([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("isoWeek"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    dayjs().endOf("isoWeek"),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [orderBy, setOrderBy] = useState<keyof FlatCargoItem>("requestDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vesselsData, requestsData, buData] = await Promise.all([
          getVessels(),
          getAllRequests(startDate?.toISOString(), endDate?.toISOString()),
          getBusinessUnits(),
        ]);
        setVessels(vesselsData);
        setRequests(requestsData);
        setBusinessUnits(buData);
        setSelectedVesselIds(vesselsData.map((v: Vessel) => v.vesselId || ""));
      } catch (error) {
        toast.error("Failed to load manifest data: " + error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [startDate, endDate]);

  const handleApplyDateRange = () => {
    toast.success("Filters applied");
  };

  const getFilteredItems = (): FlatCargoItem[] => {
    const flatItems: FlatCargoItem[] = [];

    requests.forEach((req) => {
      // Filter by Date - NOW HANDLED BY BACKEND
      // const reqDate = dayjs(req.earliestDeparture);
      // if (startDate && reqDate.isBefore(startDate, "day")) return;
      // if (endDate && reqDate.isAfter(endDate, "day")) return;

      // Filter by Route
      if (routeFilters.length > 0) {
        const matchesRoute = routeFilters.some((f) => {
          const matchOrigin =
            !f.origin || (req.originName || req.originId) === f.origin;
          const matchDest =
            !f.destination ||
            (req.destinationName || req.destinationId) === f.destination;
          return matchOrigin && matchDest;
        });
        if (!matchesRoute) return;
      }

      // Filter by Vessel (if assigned)
      // Note: MovementRequestItem doesn't strictly have a vessel assigned in the mock,
      // but it has assignedVoyageId. We might need more complex logic if we want to filter by vessel.
      // For now, we show all items matching the other filters.

      req.items.forEach((item) => {
        // Find assigned voyage status
        let voyageStatus = "-";
        let voyageStatusColor = "default";
        if (item.assignedVoyageId) {
          // Searching through all vessels to find the voyage
          // This might be inefficient for large datasets, but fine for now
          for (const v of vessels) {
            const voyage = v.voyages?.find(
              (voy) => voy.voyageId === item.assignedVoyageId,
            );
            if (voyage) {
              voyageStatus = voyage.statusName || "-";
              voyageStatusColor = voyage.statusColor || "default";
              break;
            }
          }
        }

        // Filter by Vessel
        // If all vessels are selected, we show everything (including unassigned)
        const isAllVesselsSelected =
          vessels.length > 0 && selectedVesselIds.length === vessels.length;

        if (selectedVesselIds.length > 0 && !isAllVesselsSelected) {
          // If item has no assigned voyage, it doesn't belong to any vessel
          if (!item.assignedVoyageId) return;

          // Check if the assigned voyage belongs to one of the selected vessels
          let voyageFound = false;
          for (const vId of selectedVesselIds) {
            const vessel = vessels.find((v) => v.vesselId === vId);
            if (
              vessel?.voyages?.some(
                (voy) => voy.voyageId === item.assignedVoyageId,
              )
            ) {
              voyageFound = true;
              break;
            }
          }
          if (!voyageFound) return;
        }

        const bu = businessUnits.find(
          (b) => b.businessUnitId === req.businessUnitId,
        );

        flatItems.push({
          ...item,
          requestId: req.requestId,
          origin: req.originName || req.originId,
          destination: req.destinationName || req.destinationId,
          earliestDeparture: req.earliestDeparture,
          latestArrival: req.latestArrival,
          urgency: req.urgency || "Normal",
          parentIsHazardous: req.isHazardous,
          businessUnitName: bu ? bu.businessUnit : "-",
          requestDate: req.requestDate || "-",
          voyageStatus,
          voyageStatusColor,
        });
      });
    });

    return flatItems;
  };

  const filteredItems = getFilteredItems();

  const handleRequestSort = (property: keyof FlatCargoItem) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...filteredItems].sort((a, b) => {
    let aValue = a[orderBy];
    let bValue = b[orderBy];

    if (aValue === null || aValue === undefined) aValue = "";
    if (bValue === null || bValue === undefined) bValue = "";

    if (typeof aValue === "number" && typeof bValue === "number") {
      return order === "asc" ? aValue - bValue : bValue - aValue;
    }

    return order === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  const exportToCSV = () => {
    if (sortedItems.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = [
      "Item ID",
      "Request ID",
      "Description",
      "Quantity",
      "UoM",
      "Weight (t)",
      "Origin",
      "Destination",
      "Earliest Departure",
      "Latest Arrival",
      "Urgency",
      "Hazardous",
    ];

    const csvContent = [
      headers.join(","),
      ...sortedItems.map((item) =>
        [
          item.itemId,
          item.requestId,
          `"${item.description || ""}"`,
          item.quantity,
          item.unitOfMeasurement,
          item.weight || 0,
          item.origin,
          item.destination,
          dayjs(item.earliestDeparture).format("YYYY-MM-DD HH:mm"),
          dayjs(item.latestArrival).format("YYYY-MM-DD HH:mm"),
          item.urgency,
          item.isHazardous || item.parentIsHazardous ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cargo_manifest_${dayjs().format("YYYYMMDD")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Manifest exported to CSV");
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--bg)",
      }}
    >
      <MarineHeader
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        onApplyDateRange={handleApplyDateRange}
        vessels={vessels}
        selectedVesselIds={selectedVesselIds}
        setSelectedVesselIds={setSelectedVesselIds}
        routeFilters={routeFilters}
        setRouteFilters={setRouteFilters}
        onOptimize={() => {}}
        onCompareScenarios={() => {}}
        title="Material Request Dashboard"
        hideActions={true}
      />

      {isLoading && <LinearProgress sx={{ height: 2 }} />}

      <CargoManifestStats
        sortedItems={sortedItems}
        requests={requests}
        vessels={vessels}
        businessUnits={businessUnits}
      />

      <CargoManifestTable
        sortedItems={sortedItems}
        orderBy={orderBy}
        order={order}
        handleRequestSort={handleRequestSort}
        exportToCSV={exportToCSV}
      />
    </Box>
  );
}
