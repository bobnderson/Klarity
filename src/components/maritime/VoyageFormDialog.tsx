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
import { Plus, Trash2, Ship, Plane } from "lucide-react";
import type {
  UnifiedVessel,
  UnifiedVoyage,
  VoyageStop,
} from "../../types/maritime/marine";
import type { Flight } from "../../types/aviation/flight";
import { getVessels } from "../../services/maritime/vesselService";
import { getHelicopters } from "../../services/maritime/helicopterService";
import {
  createVoyage,
  updateVoyage,
} from "../../services/maritime/voyageService";
import {
  createFlight,
  updateFlight,
} from "../../services/maritime/flightService";
import { getLocations } from "../../services/maritime/locationService";
import type { Location } from "../../types/maritime/logistics";
import { toast } from "react-toastify";

interface VoyageFormDialogProps {
  open: boolean;
  initialData?: UnifiedVoyage | Flight; // Updated type to include Flight
  onClose: () => void;
  onSuccess: (newVoyage: UnifiedVoyage | Flight) => void; // Updated type
  isAviation?: boolean;
}

export function VoyageFormDialog({
  open,
  initialData,
  onClose,
  onSuccess,
  isAviation = false,
}: VoyageFormDialogProps) {
  const [vessels, setVessels] = useState<UnifiedVessel[]>([]);
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
      if (isAviation) {
        getHelicopters().then(setVessels);
      } else {
        getVessels().then(setVessels);
      }
      getLocations().then(setLocations);
      if (initialData) {
        setFormData({
          vesselId:
            (initialData as any).vesselId ||
            (initialData as any).helicopterId ||
            "",
          origin:
            (initialData as any).originId || (initialData as any).origin || "",
          destination:
            (initialData as any).destinationId ||
            (initialData as any).destination ||
            "",
          departureDateTime: dayjs(initialData.departureDateTime),
          eta: dayjs(
            (initialData as Voyage).eta ||
              (initialData as Flight).arrivalDateTime,
          ),
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
  }, [open, initialData, isAviation]);

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
      toast.error(
        isAviation
          ? "Arrival Time cannot be before Departure time"
          : "ETA cannot be before Departure time",
      );
      return;
    }

    const selectedVessel = vessels.find(
      (v) =>
        ((v as any).vesselId || (v as any).helicopterId) === formData.vesselId,
    );
    const vesselName =
      (selectedVessel as any)?.vesselName ||
      (selectedVessel as any)?.helicopterName;

    try {
      if (initialData) {
        if (isAviation) {
          const updated = await updateFlight({
            ...initialData,
            helicopterId: formData.vesselId,
            helicopterName: vesselName || (initialData as any).helicopterName,
            originId: formData.origin,
            destinationId: formData.destination,
            departureDateTime: formData.departureDateTime.toISOString(),
            arrivalDateTime: formData.eta.toISOString(),
            stops: stops as any,
          } as any);
          toast.success("Flight updated successfully");
          onSuccess(updated as any);
        } else {
          const updated = await updateVoyage({
            ...initialData,
            vesselId: formData.vesselId,
            vesselName: vesselName || (initialData as any).vesselName,
            originId: formData.origin,
            destinationId: formData.destination,
            departureDateTime: formData.departureDateTime.toISOString(),
            eta: formData.eta.toISOString(),
            stops: stops,
          } as any);
          toast.success("Voyage updated successfully");
          onSuccess(updated as any);
        }
      } else {
        if (isAviation) {
          const newFlight = await createFlight({
            helicopterId: formData.vesselId,
            originId: formData.origin,
            destinationId: formData.destination,
            departureDateTime: formData.departureDateTime.toISOString(),
            arrivalDateTime: formData.eta.toISOString(),
            stops: stops as any,
          } as any);
          toast.success("Flight created successfully");
          onSuccess(newFlight as any);
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
      }
      onClose();
    } catch (error) {
      const entity = isAviation ? "flight" : "voyage";
      toast.error(
        initialData
          ? `Failed to update ${entity}`
          : `Failed to create ${entity}`,
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
    (v) =>
      ((v as any).vesselId || (v as any).helicopterId) === formData.vesselId,
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
        {initialData
          ? isAviation
            ? "Edit Flight"
            : "Edit Voyage"
          : isAviation
            ? "Create New Flight"
            : "Create New Voyage"}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label={isAviation ? "Helicopter" : "Vessel"}
              value={formData.vesselId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, vesselId: e.target.value })
              }
              size="small"
              sx={inputSx}
            >
              {vessels.map((v: any, vIdx: number) => {
                const vid = v.vesselId || v.helicopterId;
                const vname = v.vesselName || v.helicopterName;
                return (
                  <MenuItem key={vid || vIdx} value={vid} sx={menuItemSx}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {isAviation ? <Plane size={14} /> : <Ship size={14} />}
                        <span>{vname}</span>
                      </Box>
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
                );
              })}
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
                  {isAviation
                    ? "AIRCRAFT SPECIFICATIONS"
                    : "VESSEL SPECIFICATIONS"}
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
                      {(
                        (selectedVesselObj as any).capacities?.deadWeight ||
                        (selectedVesselObj as any).capacities?.maxPayload
                      )?.toLocaleString() || "-"}{" "}
                      t
                    </Typography>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      {(
                        (selectedVesselObj as any).capacities?.deckArea ||
                        (selectedVesselObj as any).capacities?.cabinPayload
                      )?.toLocaleString() || "-"}{" "}
                      {isAviation ? "kg Cabin" : "m² Deck"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      display="block"
                      sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                    >
                      COMPLEMENT / SEATS
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.875rem", mt: 0.5 }}
                    >
                      {(selectedVesselObj as any).capacities?.totalComplement ||
                        (selectedVesselObj as any).passengerSeats ||
                        "-"}{" "}
                      {isAviation ? "Seats" : "Persons"}
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
                      {(selectedVesselObj as any).performance?.serviceSpeed ||
                        (selectedVesselObj as any).performance?.cruiseSpeed ||
                        "-"}{" "}
                      kts
                    </Typography>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      {isAviation ? "Cruise Speed" : "Service Speed"}
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
                label={isAviation ? "Arrival Time" : "ETA"}
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
          {initialData
            ? isAviation
              ? "Update Flight"
              : "Update Voyage"
            : isAviation
              ? "Create Flight"
              : "Create Voyage"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
