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
  Button,
  TableSortLabel,
  Chip,
} from "@mui/material";
import {
  Download,
  Package,
  AlertTriangle,
  Layers,
  FileText,
  MapPin,
  Maximize,
  Briefcase,
} from "lucide-react";
import { LinearProgress } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { AviationHeader } from "../components/maritime/AviationHeader";
import { getVessels } from "../services/maritime/vesselService";
import { getAllRequests } from "../services/maritime/marineMovementService";
import type { Vessel } from "../types/maritime/marine";
import type {
  MovementRequest,
  MovementRequestItem,
  BusinessUnitOption,
} from "../types/maritime/logistics";
import { getBusinessUnits } from "../services/maritime/referenceDataService";
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
  businessUnitName: string;
  requestDate: string;
  voyageStatus?: string;
  voyageStatusColor?: string;
}

export function AviationDashboardPage() {
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
          getVessels("Helicopter"),
          getAllRequests(
            startDate?.toISOString(),
            endDate?.toISOString(),
            "Aviation",
          ),
          getBusinessUnits(),
        ]);
        setVessels(vesselsData);
        setRequests(requestsData);
        setBusinessUnits(buData);
        setSelectedVesselIds(vesselsData.map((v: Vessel) => v.vesselId || ""));
      } catch (error) {
        toast.error("Failed to load dashboard data: " + error);
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

      req.items.forEach((item) => {
        let voyageStatus = "-";
        let voyageStatusColor = "default";
        if (item.assignedVoyageId) {
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

        const isAllVesselsSelected =
          vessels.length > 0 && selectedVesselIds.length === vessels.length;

        if (selectedVesselIds.length > 0 && !isAllVesselsSelected) {
          if (!item.assignedVoyageId) return;

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
      `aviation_dashboard_${dayjs().format("YYYYMMDD")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Dashboard data exported to CSV");
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
      <AviationHeader
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
        hideActions={true}
        title="Aviation Dashboard"
        onOptimize={() => {}}
        onCompareScenarios={() => {}}
      />

      {isLoading && <LinearProgress sx={{ height: 2 }} />}

      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 1,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 2,
        }}
      >
        {[
          {
            label: "Pax & Cargo Items",
            value: formatNumber(sortedItems.length),
            icon: <Layers size={20} />,
            color: "var(--accent)",
            bg: "var(--accent-alpha)",
          },
          {
            label: "Top Route",
            value: (() => {
              const routes = sortedItems.map(
                (i) => `${i.origin} → ${i.destination}`,
              );
              if (routes.length === 0) return "-";
              const counts = routes.reduce(
                (acc, route) => {
                  acc[route] = (acc[route] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>,
              );
              return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
            })(),
            icon: <MapPin size={20} />,
            color: "#f59e0b",
            bg: "rgba(245, 158, 11, 0.1)",
          },
          {
            label: "Payload Util.",
            value: (() => {
              const uniqueRequestIds = new Set(
                sortedItems.map((i) => i.requestId),
              );
              const involvedRequests = requests.filter((r) =>
                uniqueRequestIds.has(r.requestId),
              );
              const totalRequiredWeight = involvedRequests.reduce(
                (sum, req) => sum + (req.totalWeight || 0),
                0,
              );

              const totalFleetCapacity = vessels.reduce(
                (sum, v) => sum + (v.capacities?.deadWeight || 0),
                0,
              );

              if (totalFleetCapacity === 0) return "0%";

              const util = (totalRequiredWeight / totalFleetCapacity) * 100;
              return `${formatNumber(util)}%`;
            })(),
            icon: <Maximize size={20} />,
            color: "#8b5cf6",
            bg: "rgba(139, 92, 246, 0.1)",
          },
          {
            label: "Top Business Unit",
            value: (() => {
              const uniqueRequestIds = new Set(
                sortedItems.map((i) => i.requestId),
              );
              const involvedRequests = requests.filter((r) =>
                uniqueRequestIds.has(r.requestId),
              );

              const buCounts = involvedRequests.reduce(
                (acc, req) => {
                  if (req.businessUnitId) {
                    acc[req.businessUnitId] =
                      (acc[req.businessUnitId] || 0) + 1;
                  }
                  return acc;
                },
                {} as Record<string, number>,
              );

              const sorted = Object.entries(buCounts).sort(
                (a, b) => b[1] - a[1],
              );
              if (sorted.length === 0) return "-";

              const topBuId = sorted[0][0];
              const bu = businessUnits.find(
                (b) => b.businessUnitId === topBuId,
              );
              return bu ? bu.businessUnit : "Unknown";
            })(),
            icon: <Briefcase size={20} />,
            color: "#ec4899",
            bg: "rgba(236, 72, 153, 0.1)",
          },
          {
            label: "Total Requests",
            value: formatNumber(
              new Set(sortedItems.map((i) => i.requestId)).size,
            ),
            icon: <FileText size={20} />,
            color: "#10b981",
            bg: "rgba(16, 185, 129, 0.1)",
          },
        ].map((kpi, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "16px",
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              transition: "transform 0.2s ease, border-color 0.2s ease",
              "&:hover": {
                transform: "translateY(-4px)",
                borderColor: "var(--accent-alpha)",
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: "12px",
                bgcolor: kpi.bg,
                color: kpi.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 8px 16px ${kpi.bg}`,
              }}
            >
              {kpi.icon}
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: "block",
                }}
              >
                {kpi.label}
              </Typography>
              <Typography
                variant={
                  kpi.label === "Top Route" || kpi.label === "Top Business Unit"
                    ? "body1"
                    : "h5"
                }
                sx={{ fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}
              >
                {kpi.value}
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>

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
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 3,
          }}
        >
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
                {[
                  { id: "requestId", label: "Request" },
                  { id: "requestDate", label: "Date" },
                  { id: "businessUnitName", label: "Business Unit" },
                  { id: "itemTypeName", label: "Description" },
                  { id: "quantity", label: "Qty / Pax" },
                  { id: "weight", label: "Weight (t)" },
                  { id: "origin", label: "Origin" },
                  { id: "destination", label: "Destination" },
                  { id: "earliestDeparture", label: "Departure" },
                  { id: "parentIsHazardous", label: "Hazardous" },
                  { id: "urgency", label: "Urgency" },
                  { id: "voyageStatus", label: "Flight Status" }, // Changed from Voyage
                ].map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{
                      bgcolor: "var(--panel)",
                      fontWeight: 600,
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : "asc"}
                      onClick={() =>
                        handleRequestSort(headCell.id as keyof FlatCargoItem)
                      }
                      sx={{
                        "&.MuiTableSortLabel-root": {
                          color: "var(--text)",
                        },
                        "&.MuiTableSortLabel-root:hover": {
                          color: "var(--text)",
                        },
                        "&.Mui-active": {
                          color: "var(--text)",
                        },
                        "& .MuiTableSortLabel-icon": {
                          color: "var(--text-secondary) !important",
                        },
                      }}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
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
                        No aviation items found matching the current filters.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                sortedItems.map((item, idx) => (
                  <TableRow
                    key={`${item.requestId}-${item.itemId}-${idx}`}
                    sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}
                  >
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
                      {item.requestDate
                        ? dayjs(item.requestDate).format("DD MMM YYYY")
                        : "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.businessUnitName}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.itemTypeName || item.description || "-"}
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
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                          <AlertTriangle size={18} color="#f43f5e" />
                        </Box>
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
                    <TableCell sx={{ borderBottom: "1px solid var(--border)" }}>
                      {item.voyageStatus !== "-" && (
                        <Chip
                          label={item.voyageStatus}
                          size="small"
                          onClick={(e) => {
                            if (item.voyageStatus === "Enroute") {
                              e.stopPropagation();
                            }
                          }}
                          sx={{
                            bgcolor:
                              item.voyageStatus === "Enroute"
                                ? "rgba(56, 189, 248, 0.1)"
                                : "rgba(100, 116, 139, 0.1)",
                            color:
                              item.voyageStatus === "Enroute"
                                ? "var(--accent)"
                                : "var(--text-secondary)",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                          }}
                        />
                      )}
                      {item.voyageStatus === "-" && (
                        <span
                          style={{ color: "var(--muted)", fontSize: "0.85rem" }}
                        >
                          -
                        </span>
                      )}
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
