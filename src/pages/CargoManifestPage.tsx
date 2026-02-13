import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from "@mui/material";
import { Download, Package, AlertTriangle } from "lucide-react";
import { LinearProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { MarineHeader } from "../components/maritime/MarineHeader";
import { getVessels } from "../services/maritime/vesselService";
import { getAllRequests } from "../services/maritime/marineMovementService";
import type { Vessel } from "../types/maritime/marine";
import type {
  MovementRequest,
  MovementRequestItem,
} from "../types/maritime/logistics";
import { toast } from "react-toastify";
import { formatNumber } from "../utils/formatters";

interface FlatCargoItem extends MovementRequestItem {
  requestId: string;
  origin: string;
  destination: string;
  earliestDeparture: string;
  latestArrival: string;
  urgency: string;
  parentIsHazardous: boolean;
}

export function CargoManifestPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [requests, setRequests] = useState<MovementRequest[]>([]);
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [vesselsData, requestsData] = await Promise.all([
          getVessels(),
          getAllRequests(),
        ]);
        setVessels(vesselsData);
        setRequests(requestsData);
        setSelectedVesselIds(vesselsData.map((v: Vessel) => v.vesselId || ""));
      } catch (error) {
        toast.error("Failed to load manifest data: " + error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleApplyDateRange = () => {
    toast.success("Filters applied");
  };

  const getFilteredItems = (): FlatCargoItem[] => {
    const flatItems: FlatCargoItem[] = [];

    requests.forEach((req) => {
      // Filter by Date
      const reqDate = dayjs(req.earliestDeparture);
      if (startDate && reqDate.isBefore(startDate, "day")) return;
      if (endDate && reqDate.isAfter(endDate, "day")) return;

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
        flatItems.push({
          ...item,
          requestId: req.requestId,
          origin: req.originName || req.originId,
          destination: req.destinationName || req.destinationId,
          earliestDeparture: req.earliestDeparture,
          latestArrival: req.latestArrival,
          urgency: req.urgency || "Normal",
          parentIsHazardous: req.isHazardous,
        });
      });
    });

    return flatItems;
  };

  const filteredItems = getFilteredItems();

  const exportToCSV = () => {
    if (filteredItems.length === 0) {
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
      ...filteredItems.map((item) =>
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
        // These are required by MarineHeader props but not strictly used here
        onOptimize={() => {}}
        onCompareScenarios={() => {}}
      />

      {isLoading && <LinearProgress sx={{ height: 2 }} />}

      <Box
        sx={{
          p: 3,
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "var(--text)", mb: 0.5 }}
            >
              Cargo Manifest
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--muted)" }}>
              Detailed list of all cargo items across pending and scheduled
              requests.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Download size={18} />}
            onClick={exportToCSV}
            className="btn-primary-gradient"
            sx={{ borderRadius: "8px", px: 3 }}
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            flex: 1,
            bgcolor: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            boxShadow: "none",
            overflow: "auto",
          }}
        >
          <Table stickyHeader sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Item ID
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Request
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Description
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Qty
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Weight (t)
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Origin
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Destination
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Departure
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Hazardous
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "var(--bg-soft)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  Urgency
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    sx={{ py: 10, textAlign: "center", borderBottom: "none" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                        color: "var(--muted)",
                      }}
                    >
                      <Package size={48} opacity={0.3} />
                      <Typography>
                        No cargo items found matching the current filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item, idx) => (
                  <TableRow
                    key={`${item.requestId}-${item.itemId}-${idx}`}
                    sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}
                  >
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.itemId}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        fontWeight: 600,
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.requestId}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.description}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {formatNumber(item.quantity)} {item.unitOfMeasurement}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {formatNumber(item.weight)}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.origin}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.destination}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {dayjs(item.earliestDeparture).format("DD MMM HH:mm")}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid var(--border)" }}>
                      {(item.isHazardous || item.parentIsHazardous) && (
                        <Chip
                          label="Hazardous"
                          size="small"
                          icon={<AlertTriangle size={12} />}
                          sx={{
                            bgcolor: "rgba(244, 63, 94, 0.1)",
                            color: "#f43f5e",
                            border: "1px solid rgba(244, 63, 94, 0.2)",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ borderBottom: "1px solid var(--border)" }}>
                      <Chip
                        label={item.urgency}
                        size="small"
                        sx={{
                          bgcolor: "rgba(56, 189, 248, 0.1)",
                          color: "var(--accent)",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
