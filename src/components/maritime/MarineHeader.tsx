import { Dayjs } from "dayjs";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { RefreshCw } from "lucide-react";
import { HeaderHorizon } from "./header/HeaderHorizon";
import { HeaderRoutes } from "./header/HeaderRoutes";
import { HeaderVessels } from "./header/HeaderVessels";
import type { Vessel } from "../../types/maritime/marine";

interface MarineHeaderProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  onApplyDateRange: () => void;
  vessels: Vessel[];
  selectedVesselIds: string[];
  setSelectedVesselIds: (ids: string[]) => void;
  routeFilters: Array<{ origin: string | null; destination: string | null }>;
  setRouteFilters: (
    filters: Array<{ origin: string | null; destination: string | null }>,
  ) => void;
  onOptimize: () => void;
  onCompareScenarios: () => void;
  onRefresh?: () => void;
  title?: string;
  hideActions?: boolean;
}

export function MarineHeader({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onApplyDateRange,
  vessels,
  selectedVesselIds,
  setSelectedVesselIds,
  routeFilters,
  setRouteFilters,
  onOptimize,
  onCompareScenarios,
  onRefresh,
  title = "Marine Planner",
  hideActions = false,
}: MarineHeaderProps) {
  return (
    <Box component="header" className="top-nav" sx={{ mx: 1.25, mt: 1.25 }}>
      <Box className="top-nav-left">
        <Box className="brand">
          <span className="brand-pill"></span>
          <Typography
            variant="h6"
            component="span"
            sx={{ fontSize: 16, fontWeight: 600, letterSpacing: "0.04em" }}
          >
            {title}
          </Typography>
        </Box>

        <HeaderHorizon
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onApplyDateRange={onApplyDateRange}
        />
        <HeaderRoutes
          routeFilters={routeFilters}
          setRouteFilters={setRouteFilters}
        />
        <HeaderVessels
          vessels={vessels}
          selectedVesselIds={selectedVesselIds}
          setSelectedVesselIds={setSelectedVesselIds}
        />

        {/* <Box className="toggle-custom">
          <span className="chip-label">Simulation</span>
          <strong>Off</strong>
        </Box> */}
      </Box>

      <Box className="top-nav-right">
        <span className="badge-custom">
          <span className="badge-dot"></span>
          Live Plan · Stable
        </span>

        {onRefresh && (
          <Tooltip title="Refresh Data">
            <IconButton
              onClick={onRefresh}
              size="small"
              sx={{
                color: "var(--muted)",
                "&:hover": { color: "var(--text)", bgcolor: "var(--bg-soft)" },
                mr: 1,
              }}
            >
              <RefreshCw size={16} />
            </IconButton>
          </Tooltip>
        )}

        {/* <button className="btn-ghost-custom">Save Version</button> */}
        {!hideActions && (
          <>
            <button className="btn-ghost-custom" onClick={onCompareScenarios}>
              Compare Scenarios
            </button>
            <button className="btn btn-primary-gradient" onClick={onOptimize}>
              Optimise Plan
            </button>
          </>
        )}

        {/* <Box className="notif-btn">
          <Bell size={14} />
          <span className="notif-dot"></span>
        </Box> */}
      </Box>
    </Box>
  );
}
