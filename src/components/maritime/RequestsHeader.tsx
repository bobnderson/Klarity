import { Dayjs } from "dayjs";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { RefreshCw } from "lucide-react";
import { HeaderHorizon } from "./header/HeaderHorizon";
import { HeaderRoutes } from "./header/HeaderRoutes";

interface RequestsHeaderProps {
  title: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  onApplyDateRange: () => void;
  routeFilters: Array<{ origin: string | null; destination: string | null }>;
  setRouteFilters: (
    filters: Array<{ origin: string | null; destination: string | null }>,
  ) => void;
  onRefresh?: () => void;
  rightAction?: React.ReactNode;
}

export function RequestsHeader({
  title,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onApplyDateRange,
  routeFilters,
  setRouteFilters,
  onRefresh,
  rightAction,
}: RequestsHeaderProps) {
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
      </Box>

      <Box className="top-nav-right">
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

        {rightAction}
      </Box>
    </Box>
  );
}
