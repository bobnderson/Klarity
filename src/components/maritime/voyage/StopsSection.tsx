import {
  Grid,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  MenuItem,
  IconButton,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Plus, Trash2 } from "lucide-react";
import type { VoyageStop } from "../../../types/maritime/marine";
import type { Location } from "../../../types/maritime/logistics";

interface StopsSectionProps {
  stops: VoyageStop[];
  locations: Location[];
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onStopChange: (index: number, field: keyof VoyageStop, value: any) => void;
}

const inputSx = {
  "& .MuiInputBase-root": { fontSize: "0.875rem" },
  "& .MuiInputLabel-root": { fontSize: "0.875rem" },
};

const menuItemSx = {
  fontSize: "0.875rem",
};

export function StopsSection({
  stops,
  locations,
  onAddStop,
  onRemoveStop,
  onStopChange,
}: StopsSectionProps) {
  return (
    <Grid size={{ xs: 12 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2">Intermediate Stops</Typography>
        <Button startIcon={<Plus size={16} />} size="small" onClick={onAddStop}>
          Add Stop
        </Button>
      </Box>
      {stops.map((stop, index) => (
        <Paper
          key={stop.stopId}
          variant="outlined"
          sx={{ p: 2, mb: 1, bgcolor: "var(--bg-subtle)" }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 11 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label={`Stop #${index + 1}`}
                    value={stop.locationId}
                    onChange={(e) =>
                      onStopChange(index, "locationId", e.target.value)
                    }
                    size="small"
                    sx={inputSx}
                  >
                    {locations.map((loc) => (
                      <MenuItem
                        key={loc.locationId}
                        value={loc.locationId}
                        sx={menuItemSx}
                      >
                        {loc.locationName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Grid size={{ xs: 6, md: 4 }}>
                    <DateTimePicker
                      label="Arrival"
                      value={dayjs(stop.arrivalDateTime)}
                      onChange={(newValue) =>
                        onStopChange(
                          index,
                          "arrivalDateTime",
                          newValue?.toISOString(),
                        )
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          sx: inputSx,
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 4 }}>
                    <DateTimePicker
                      label="Departure"
                      value={dayjs(stop.departureDateTime)}
                      onChange={(newValue) =>
                        onStopChange(
                          index,
                          "departureDateTime",
                          newValue?.toISOString(),
                        )
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          sx: inputSx,
                        },
                      }}
                    />
                  </Grid>
                </LocalizationProvider>
              </Grid>
            </Grid>
            <Grid size={{ xs: 1 }} sx={{ textAlign: "right" }}>
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemoveStop(index)}
              >
                <Trash2 size={16} />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}
      {stops.length === 0 && (
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ fontStyle: "italic", textAlign: "center", py: 1 }}
        >
          No intermediate stops added.
        </Typography>
      )}
    </Grid>
  );
}
