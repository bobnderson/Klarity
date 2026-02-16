import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Autocomplete,
} from "@mui/material";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Filter,
  BarChart2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import type { UnifiedVessel } from "../../types/maritime/marine";

interface AviationHeaderProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  onApplyDateRange: () => void;
  vessels: UnifiedVessel[];
  selectedVesselIds: string[];
  setSelectedVesselIds: (ids: string[]) => void;
  routeFilters: Array<{ origin: string | null; destination: string | null }>;
  setRouteFilters: (
    filters: Array<{ origin: string | null; destination: string | null }>,
  ) => void;
  onOptimize?: () => void;
  onCompareScenarios?: () => void;
  onRefresh?: () => void;
  hideActions?: boolean;
  title?: string;
}

export function AviationHeader({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onApplyDateRange,
  vessels,
  selectedVesselIds,
  setSelectedVesselIds,
  onOptimize,
  onRefresh,
  hideActions,
  title,
}: AviationHeaderProps) {
  return (
    <Box
      component="header"
      className="planner-header"
      sx={{
        mx: 1.25,
        mt: 1.25,
        p: 1.5,
        borderBottom: "1px solid var(--border)",
        bgcolor: "var(--panel)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      {/* LEFT: Title & Date Range */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: 16,
              color: "var(--text-primary)",
              lineHeight: 1.2,
            }}
          >
            {title || "Aviation Planner"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: "var(--muted)" }}>
            Flight Scheduling & Logistics
          </Typography>
        </Box>

        <Box
          sx={{
            height: 24,
            width: 1,
            bgcolor: "var(--border)",
            mx: 1,
          }}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 130, "& input": { fontSize: 12 } },
                },
              }}
            />
            <ArrowRight size={14} className="text-muted" />
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              slotProps={{
                textField: {
                  size: "small",
                  sx: { width: 130, "& input": { fontSize: 12 } },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={onApplyDateRange}
              sx={{
                bgcolor: "var(--primary-alpha)",
                color: "var(--primary)",
                "&:hover": { bgcolor: "var(--primary-alpha-hover)" },
              }}
            >
              <CalendarIcon size={16} />
            </IconButton>
          </Box>
        </LocalizationProvider>
      </Box>

      {/* RIGHT: Filters & Actions */}
      {!hideActions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Vessel (Helicopter) Filter */}
          <Autocomplete
            multiple
            size="small"
            options={vessels}
            getOptionLabel={(option) => option.vesselName}
            value={vessels.filter(
              (v) => v.vesselId && selectedVesselIds.includes(v.vesselId),
            )}
            onChange={(_, newValue) => {
              setSelectedVesselIds(
                newValue.map((v) => v.vesselId!).filter(Boolean),
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Filter Helicopters"
                sx={{ minWidth: 200, "& input": { fontSize: 12 } }}
              />
            )}
          />

          <Button
            variant="outlined"
            size="small"
            startIcon={<Filter size={14} />}
            sx={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              textTransform: "none",
              height: 32,
            }}
          >
            Filters
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<BarChart2 size={14} />}
            onClick={onOptimize}
            sx={{
              bgcolor: "var(--primary)",
              textTransform: "none",
              height: 32,
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
            }}
          >
            Optimize Flights
          </Button>

          <IconButton
            size="small"
            onClick={onRefresh}
            sx={{
              color: "var(--text-secondary)",
              "&:hover": { bgcolor: "var(--panel-hover)" },
            }}
          >
            <RefreshCw size={16} />
          </IconButton>

          <Box
            sx={{ width: 1, height: 24, bgcolor: "var(--border)", mx: 0.5 }}
          />

          <Button
            variant="contained"
            size="small"
            startIcon={<Plus size={14} />}
            sx={{
              bgcolor: "#22c55e",
              "&:hover": { bgcolor: "#16a34a" },
              textTransform: "none",
              height: 32,
            }}
          >
            New Flight
          </Button>
        </Box>
      )}
    </Box>
  );
}
