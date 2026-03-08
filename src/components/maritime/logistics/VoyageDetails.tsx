import {
  Box,
  TextField,
  Grid,
  Paper,
  MenuItem,
  Typography,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Ship } from "lucide-react";
import dayjs from "dayjs";
import type { MovementRequest } from "../../../types/maritime/logistics";
import type { Route, Voyage } from "../../../types/maritime/marine";

interface VoyageDetailsProps {
  formData: MovementRequest;
  handleFormUpdate: (field: keyof MovementRequest, value: any) => void;
  availableRoutes: Route[];
  filteredVoyages: Voyage[];
  isReadOnly: boolean;
}

export const VoyageDetails = ({
  formData,
  handleFormUpdate,
  availableRoutes,
  filteredVoyages,
  isReadOnly,
}: VoyageDetailsProps) => {
  return (
    <Paper
      sx={{
        p: 3,
        bgcolor: "var(--panel)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <Box
        sx={{
          mb: 3,
          pb: 1,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Typography
          variant="subtitle1"
          color="primary"
          fontWeight={600}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontSize: "0.95rem",
          }}
        >
          <Ship size={20} />
          VOYAGE DETAILS
        </Typography>
      </Box>

      <Grid container spacing={2} alignItems="center">
        {/* Origin */}
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Origin"
            value={formData.originId || ""}
            onChange={(e) => handleFormUpdate("originId", e.target.value)}
            size="small"
            className="compact-form-field"
          >
            {(availableRoutes || []).map((route) => (
              <MenuItem
                key={route.routeId}
                value={route.routeId}
                className="compact-menu-item"
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Typography variant="inherit">{route.route}</Typography>
                  <Chip
                    label={route.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 18,
                      fontSize: "0.625rem",
                      borderColor:
                        route.status === "Active"
                          ? "var(--success)"
                          : "var(--text-secondary)",
                      color:
                        route.status === "Active"
                          ? "var(--success)"
                          : "var(--text-secondary)",
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Destination */}
        <Grid size={{ xs: 12, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Destination"
            value={formData.destinationId || ""}
            onChange={(e) => handleFormUpdate("destinationId", e.target.value)}
            size="small"
            className="compact-form-field"
          >
            {(availableRoutes || []).map((route) => (
              <MenuItem
                key={route.routeId}
                value={route.routeId}
                className="compact-menu-item"
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Typography variant="inherit">{route.route}</Typography>
                  <Chip
                    label={route.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 18,
                      fontSize: "0.625rem",
                      borderColor:
                        route.status === "Active"
                          ? "var(--success)"
                          : "var(--text-secondary)",
                      color:
                        route.status === "Active"
                          ? "var(--success)"
                          : "var(--text-secondary)",
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 2 }}>
          <DatePicker
            label="Earliest Departure"
            value={
              formData.earliestDeparture
                ? dayjs(formData.earliestDeparture)
                : null
            }
            onChange={(newValue: dayjs.Dayjs | null) =>
              handleFormUpdate(
                "earliestDeparture",
                newValue?.toISOString() || "",
              )
            }
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                className: "compact-form-field",
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            fullWidth
            label="Scheduled Voyage"
            value={formData.selectedVoyageId || ""}
            onChange={(e) =>
              handleFormUpdate("selectedVoyageId", e.target.value)
            }
            size="small"
            disabled={
              isReadOnly || !formData.originId || !formData.destinationId
            }
            className="compact-form-field"
            helperText={
              !formData.originId || !formData.destinationId
                ? "Select origin and destination first"
                : filteredVoyages.length === 0
                  ? "No voyages found for this route/date"
                  : ""
            }
          >
            {filteredVoyages.map((v) => (
              <MenuItem
                key={v.voyageId}
                value={v.voyageId}
                className="compact-menu-item"
              >
                <Box sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="body2" fontWeight="600">
                      {v.vesselName}
                    </Typography>
                    <Typography variant="caption" color="var(--accent)">
                      {dayjs(v.departureDateTime).format("DD MMM HH:mm")}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 0.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Util: {v.deckUtil}% / {v.weightUtil}%
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      ETA: {dayjs(v.eta).format("DD MMM HH:mm")}
                    </Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </Paper>
  );
};
