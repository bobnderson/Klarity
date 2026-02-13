import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Chip,
  Paper,
  Typography,
  IconButton,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { Plus, Trash2 } from "lucide-react";
import type { Vessel, Voyage, VoyageStop } from "../../types/maritime/marine";
import { getVessels } from "../../services/maritime/vesselService";
import {
  createVoyage,
  updateVoyage,
} from "../../services/maritime/voyageService";
import { getLocations } from "../../services/maritime/locationService";
import type { Location } from "../../types/maritime/logistics";
import { toast } from "react-toastify";

interface VoyageFormDialogProps {
  open: boolean;
  initialData?: Voyage;
  onClose: () => void;
  onSuccess: (newVoyage: Voyage) => void;
}

export function VoyageFormDialog({
  open,
  initialData,
  onClose,
  onSuccess,
}: VoyageFormDialogProps) {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [formData, setFormData] = useState({
    vesselId: "",
    origin: "",
    destination: "",
    departureDateTime: dayjs().add(1, "day").startOf("hour"),
    eta: dayjs().add(2, "day").startOf("hour"),
  });
  const [stops, setStops] = useState<VoyageStop[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (open) {
      getVessels().then(setVessels);
      getLocations().then(setLocations);
      if (initialData) {
        setFormData({
          vesselId: initialData.vesselId,
          origin: initialData.originId || (initialData as any).origin || "",
          destination:
            initialData.destinationId || (initialData as any).destination || "",
          departureDateTime: dayjs(initialData.departureDateTime),
          eta: dayjs(initialData.eta),
        });
        setStops(initialData.stops || []);
      } else {
        setFormData({
          vesselId: "",
          origin: "",
          destination: "",
          departureDateTime: dayjs().add(1, "day").startOf("hour"),
          eta: dayjs().add(2, "day").startOf("hour"),
        });
        setStops([]);
      }
    }
  }, [open, initialData]);

  const handleAddStop = () => {
    const newStop: VoyageStop = {
      stopId: `STOP-${Date.now()}`,
      locationId: "",
      arrivalDateTime: dayjs().add(1.5, "day").toISOString(),
      departureDateTime: dayjs().add(1.6, "day").toISOString(),
      statusId: "Scheduled",
    };
    setStops([...stops, newStop]);
  };

  const handleRemoveStop = (index: number) => {
    const newStops = [...stops];
    newStops.splice(index, 1);
    setStops(newStops);
  };

  const handleStopChange = (
    index: number,
    field: keyof VoyageStop,
    value: any,
  ) => {
    const newStops = [...stops];
    newStops[index] = { ...newStops[index], [field]: value };
    setStops(newStops);
  };

  const handleSubmit = async () => {
    if (!formData.vesselId || !formData.origin || !formData.destination) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.origin === formData.destination) {
      toast.error("Origin and Destination cannot be the same");
      return;
    }

    if (formData.eta.isBefore(formData.departureDateTime)) {
      toast.error("ETA cannot be before Departure time");
      return;
    }

    const selectedVessel = vessels.find(
      (v) => v.vesselId === formData.vesselId,
    );

    try {
      if (initialData) {
        const updated = await updateVoyage({
          ...initialData,
          vesselId: formData.vesselId,
          vesselName: selectedVessel?.vesselName || initialData.vesselName,
          originId: formData.origin,
          destinationId: formData.destination,
          departureDateTime: formData.departureDateTime.toISOString(),
          eta: formData.eta.toISOString(),
          stops: stops,
        });
        toast.success("Voyage updated successfully");
        onSuccess(updated);
      } else {
        const newVoyage = await createVoyage({
          vesselId: formData.vesselId,
          originId: formData.origin,
          destinationId: formData.destination,
          departureDateTime: formData.departureDateTime.toISOString(),
          eta: formData.eta.toISOString(),
          stops: stops,
        });
        toast.success("Voyage created successfully");
        onSuccess(newVoyage);
      }
      onClose();
    } catch (error) {
      toast.error(
        initialData ? "Failed to update voyage" : "Failed to create voyage",
      );
    }
  };

  const inputSx = {
    "& .MuiInputBase-root": { fontSize: "0.875rem" },
    "& .MuiInputLabel-root": { fontSize: "0.875rem" },
  };

  const menuItemSx = {
    fontSize: "0.875rem",
  };

  const getStatusStyle = (status: string | undefined) => {
    switch (status) {
      case "Active":
        return { bgcolor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }; // Green
      case "Maintenance":
        return { bgcolor: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }; // Amber
      case "Inactive":
        return { bgcolor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }; // Red
      default:
        return { bgcolor: "rgba(148, 163, 184, 0.2)", color: "#94a3b8" }; // Grey
    }
  };

  const selectedVesselObj = vessels.find(
    (v) => v.vesselId === formData.vesselId,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
        {initialData ? "Edit Voyage" : "Create New Voyage"}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Vessel"
              value={formData.vesselId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, vesselId: e.target.value })
              }
              size="small"
              sx={inputSx}
            >
              {vessels.map((v: Vessel) => (
                <MenuItem key={v.vesselId} value={v.vesselId} sx={menuItemSx}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span>{v.vesselName}</span>
                    {v.statusId && (
                      <Chip
                        label={v.statusId}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: 9,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          borderRadius: "4px",
                          ...getStatusStyle(v.statusId),
                        }}
                      />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {selectedVesselObj && (
            <Grid size={{ xs: 12 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "rgba(0,0,0,0.02)",
                  borderStyle: "dashed",
                  borderRadius: "8px",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "var(--muted)",
                    display: "block",
                    mb: 1.5,
                    letterSpacing: "0.05em",
                    fontSize: "0.7rem",
                  }}
                >
                  VESSEL SPECIFICATIONS
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 4 }}>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      display="block"
                      sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                    >
                      CAPACITY
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.875rem", mt: 0.5 }}
                    >
                      {selectedVesselObj.capacities?.deadWeight?.toLocaleString() ||
                        "-"}{" "}
                      t
                    </Typography>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      {selectedVesselObj.capacities?.deckArea?.toLocaleString() ||
                        "-"}{" "}
                      m² Deck
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      display="block"
                      sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                    >
                      COMPLEMENT
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.875rem", mt: 0.5 }}
                    >
                      {selectedVesselObj.capacities?.totalComplement || "-"}{" "}
                      Persons
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      display="block"
                      sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                    >
                      PERFORMANCE
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.875rem", mt: 0.5 }}
                    >
                      {selectedVesselObj.performance?.serviceSpeed || "-"} kts
                    </Typography>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      Service Speed
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              fullWidth
              label="Origin"
              value={formData.origin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, origin: e.target.value })
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

          <Grid size={{ xs: 6 }}>
            <TextField
              select
              fullWidth
              label="Destination"
              value={formData.destination}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, destination: e.target.value })
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
            <Grid size={{ xs: 6 }}>
              <DateTimePicker
                label="Departure Date & Time"
                value={formData.departureDateTime}
                onChange={(newValue) =>
                  setFormData({
                    ...formData,
                    departureDateTime: newValue || dayjs(),
                  })
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
            <Grid size={{ xs: 6 }}>
              <DateTimePicker
                label="ETA"
                value={formData.eta}
                onChange={(newValue) =>
                  setFormData({ ...formData, eta: newValue || dayjs() })
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

          {/* Intermediate Stops Section */}
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
              <Button
                startIcon={<Plus size={16} />}
                size="small"
                onClick={handleAddStop}
              >
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
                            handleStopChange(
                              index,
                              "locationId",
                              e.target.value,
                            )
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
                              handleStopChange(
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
                              handleStopChange(
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
                  <Grid size={{ xs: 1 }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveStop(index)}
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
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {initialData ? "Update Voyage" : "Create Voyage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
