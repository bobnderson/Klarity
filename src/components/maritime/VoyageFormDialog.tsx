import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import dayjs from "dayjs";
import { VesselSelector } from "./voyage/VesselSelector";
import { RouteSection } from "./voyage/RouteSection";
import { ScheduleSection } from "./voyage/ScheduleSection";
import { StopsSection } from "./voyage/StopsSection";
import { RecurringSchedulesList } from "./voyage/RecurringSchedulesList";
import type {
  UnifiedVessel,
  UnifiedVoyage,
  VoyageStop,
  Voyage,
} from "../../types/maritime/marine";
import type { Flight } from "../../types/aviation/flight";
import { getVessels } from "../../services/maritime/vesselService";
import { getHelicopters } from "../../services/maritime/helicopterService";
import {
  createVoyage,
  updateVoyage,
  createVoyageSchedule,
  getVoyageSchedules,
  updateVoyageSchedule,
  deleteVoyageSchedule,
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
  initialData?: UnifiedVoyage | Flight;
  onClose: () => void;
  onSuccess: (newVoyage: UnifiedVoyage | Flight) => void;
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
  const [isRecurring, setIsRecurring] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    frequency: "Weekly",
    daysOfWeek: "",
    dayOfMonth: 1,
    departureTime: "08:00",
    durationDays: 1,
  });
  const [existingSchedules, setExistingSchedules] = useState<any[]>([]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null,
  );

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

  const handleDayToggle = (day: string) => {
    const currentDays = scheduleData.daysOfWeek
      ? scheduleData.daysOfWeek.split(",")
      : [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    const sortedDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      .filter((d) => newDays.includes(d))
      .join(",");
    setScheduleData((prev) => ({ ...prev, daysOfWeek: sortedDays }));
  };

  const loadSchedules = async () => {
    try {
      const data = await getVoyageSchedules();
      setExistingSchedules(data);
    } catch (e) {
      console.error("Failed to load schedules", e);
    }
  };

  useEffect(() => {
    if (open && isRecurring) {
      loadSchedules();
    }
  }, [open, isRecurring]);

  const handleEditSchedule = (schedule: any) => {
    setEditingScheduleId(schedule.scheduleId);
    setFormData({
      vesselId: schedule.vesselId,
      origin: schedule.originId,
      destination: schedule.destinationId,
      departureDateTime: dayjs(),
      eta: dayjs(),
    });
    setScheduleData({
      frequency: schedule.frequency,
      daysOfWeek: schedule.daysOfWeek || "",
      dayOfMonth: schedule.dayOfMonth || 1,
      departureTime: schedule.departureTime.substring(0, 5),
      durationDays: schedule.durationDays,
    });
  };

  const handleCancelEdit = () => {
    setEditingScheduleId(null);
    setFormData({
      vesselId: "",
      origin: "",
      destination: "",
      departureDateTime: dayjs().add(1, "day").startOf("hour"),
      eta: dayjs().add(2, "day").startOf("hour"),
    });
    setScheduleData({
      frequency: "Weekly",
      daysOfWeek: "",
      dayOfMonth: 1,
      departureTime: "08:00",
      durationDays: 1,
    });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteVoyageSchedule(id);
        toast.success("Schedule deleted");
        loadSchedules();
      } catch (e) {
        toast.error("Failed to delete schedule");
      }
    }
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
      if (isRecurring && !isAviation) {
        const payload = {
          scheduleId: editingScheduleId || undefined,
          vesselId: formData.vesselId,
          originId: formData.origin,
          destinationId: formData.destination,
          departureTime: scheduleData.departureTime + ":00",
          durationDays: scheduleData.durationDays,
          frequency: scheduleData.frequency,
          daysOfWeek: scheduleData.daysOfWeek,
          dayOfMonth: scheduleData.dayOfMonth,
          isActive: true,
        };

        if (editingScheduleId) {
          await updateVoyageSchedule(payload as any);
          toast.success("Schedule updated successfully");
        } else {
          await createVoyageSchedule(payload as any);
          toast.success("Recurring schedule created successfully");
        }

        handleCancelEdit();
        loadSchedules();
        return;
      }

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
        {!initialData && !isAviation && (
          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <ToggleButtonGroup
              value={isRecurring ? "recurring" : "oneoff"}
              exclusive
              onChange={(_, val) => val && setIsRecurring(val === "recurring")}
              size="small"
              color="primary"
            >
              <ToggleButton value="oneoff" sx={{ px: 3 }}>
                One-off Voyage
              </ToggleButton>
              <ToggleButton value="recurring" sx={{ px: 3 }}>
                Recurring Schedule
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <VesselSelector
            isAviation={isAviation}
            vesselId={formData.vesselId}
            vessels={vessels}
            onVesselChange={(vId) =>
              setFormData({ ...formData, vesselId: vId })
            }
            selectedVesselObj={selectedVesselObj}
          />

          <RouteSection
            origin={formData.origin}
            destination={formData.destination}
            locations={locations}
            onOriginChange={(val) => setFormData({ ...formData, origin: val })}
            onDestinationChange={(val) =>
              setFormData({ ...formData, destination: val })
            }
          />

          <ScheduleSection
            isRecurring={isRecurring}
            isAviation={isAviation}
            departureDateTime={formData.departureDateTime}
            eta={formData.eta}
            scheduleData={scheduleData}
            onDepartureChange={(val) =>
              setFormData({ ...formData, departureDateTime: val })
            }
            onEtaChange={(val) => setFormData({ ...formData, eta: val })}
            onScheduleDataChange={setScheduleData}
            onDayToggle={handleDayToggle}
          />

          <StopsSection
            stops={stops}
            locations={locations}
            onAddStop={handleAddStop}
            onRemoveStop={handleRemoveStop}
            onStopChange={handleStopChange}
          />

          {isRecurring && (
            <RecurringSchedulesList
              existingSchedules={existingSchedules}
              editingScheduleId={editingScheduleId}
              onEditSchedule={handleEditSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          )}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={editingScheduleId ? handleCancelEdit : onClose}
          variant="outlined"
          color="inherit"
        >
          {editingScheduleId ? "Cancel Edit" : "Cancel"}
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isRecurring
            ? editingScheduleId
              ? "Update Schedule"
              : "Create Schedule"
            : initialData
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
