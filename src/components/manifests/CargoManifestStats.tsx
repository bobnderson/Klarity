import { Box, Typography, Paper } from "@mui/material";
import { Layers, MapPin, Maximize, Briefcase, FileText } from "lucide-react";
import type {
  FlatCargoItem,
  MovementRequest,
  BusinessUnitOption,
} from "../../types/maritime/logistics";
import type { Vessel } from "../../types/maritime/marine";
import { formatNumber } from "../../utils/formatters";

interface CargoManifestStatsProps {
  sortedItems: FlatCargoItem[];
  requests: MovementRequest[];
  vessels: Vessel[];
  businessUnits: BusinessUnitOption[];
}

export function CargoManifestStats({
  sortedItems,
  requests,
  vessels,
  businessUnits,
}: CargoManifestStatsProps) {
  const kpis = [
    {
      label: "Total Items",
      value: formatNumber(sortedItems.length),
      icon: <Layers size={20} />,
      color: "var(--primary)",
      bg: "rgba(14, 165, 233, 0.1)",
    },
    {
      label: "Top Route",
      value: (() => {
        const routes = sortedItems.map((i) => `${i.origin} → ${i.destination}`);
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
      label: "Deckspace Util.",
      value: (() => {
        const uniqueRequestIds = new Set(sortedItems.map((i) => i.requestId));
        const involvedRequests = requests.filter((r) =>
          uniqueRequestIds.has(r.requestId),
        );
        const totalRequiredArea = involvedRequests.reduce(
          (sum, req) => sum + (req.totalDeckArea || 0),
          0,
        );
        const totalVesselCapacity = vessels.reduce(
          (sum, v) => sum + (v.capacities?.deckArea || 0),
          0,
        );
        if (totalVesselCapacity === 0) return "0%";
        const util = (totalRequiredArea / totalVesselCapacity) * 100;
        return `${formatNumber(util)}%`;
      })(),
      icon: <Maximize size={20} />,
      color: "#8b5cf6",
      bg: "rgba(139, 92, 246, 0.1)",
    },
    {
      label: "Top Business Unit",
      value: (() => {
        const uniqueRequestIds = new Set(sortedItems.map((i) => i.requestId));
        const involvedRequests = requests.filter((r) =>
          uniqueRequestIds.has(r.requestId),
        );
        const buCounts = involvedRequests.reduce(
          (acc, req) => {
            if (req.businessUnitId) {
              acc[req.businessUnitId] = (acc[req.businessUnitId] || 0) + 1;
            }
            return acc;
          },
          {} as Record<string, number>,
        );
        const sorted = Object.entries(buCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length === 0) return "-";
        const topBuId = sorted[0][0];
        const bu = businessUnits.find((b) => b.businessUnitId === topBuId);
        return bu ? bu.businessUnit : "Unknown";
      })(),
      icon: <Briefcase size={20} />,
      color: "#ec4899",
      bg: "rgba(236, 72, 153, 0.1)",
    },
    {
      label: "Total Requests",
      value: formatNumber(new Set(sortedItems.map((i) => i.requestId)).size),
      icon: <FileText size={20} />,
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.1)",
    },
  ];

  return (
    <Box
      sx={{
        px: 3,
        pt: 3,
        pb: 1,
        display: "grid",
        gridTemplateColumns: "repeat(1, 1fr)",
        "@media (min-width: 600px)": {
          gridTemplateColumns: "repeat(2, 1fr)",
        },
        "@media (min-width: 900px)": {
          gridTemplateColumns: "repeat(3, 1fr)",
        },
        "@media (min-width: 1200px)": {
          gridTemplateColumns: "repeat(5, 1fr)",
        },
        gap: 2,
      }}
    >
      {kpis.map((kpi, index) => (
        <Paper
          key={index}
          sx={{
            p: 2,
            borderRadius: "12px",
            bgcolor: "var(--panel)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "8px",
              bgcolor: kpi.bg,
              color: kpi.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {kpi.icon}
          </Box>
          <Box>
            <Typography
              variant="body2"
              sx={{ color: "var(--text-secondary)", mb: 0.5 }}
            >
              {kpi.label}
            </Typography>
            <Typography
              variant={
                kpi.label === "Top Route" || kpi.label === "Top Business Unit"
                  ? "body1"
                  : "h5"
              }
              sx={{ fontWeight: 700, color: "var(--text)" }}
            >
              {kpi.value}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
}
