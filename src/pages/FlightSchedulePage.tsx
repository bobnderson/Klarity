import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Checkbox,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  ArrowRight,
  Plane,
  RefreshCw,
} from "lucide-react";
import {
  getFlightSchedules,
  createFlightSchedule,
  updateFlightSchedule,
  deleteFlightSchedule,
} from "../services/maritime/flightScheduleService";
import { getRoutes } from "../services/maritime/routeService";
import { getHelicopters } from "../services/maritime/helicopterService";
import type { FlightSchedule } from "../types/maritime/logistics";
import type { Route, Helicopter } from "../types/maritime/marine";
import { toast } from "react-toastify";

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function FlightSchedulePage() {
  const [schedules, setSchedules] = useState<FlightSchedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [vessels, setVessels] = useState<Helicopter[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FlightSchedule | null>(
    null,
  );

  const [formData, setFormData] = useState<FlightSchedule>({
    helicopterId: "",
    originId: "",
    destinationId: "",
    departureTime: "08:00",
    durationMinutes: 60,
    frequency: "Daily",
    daysOfWeek: "",
    isActive: true,
  });

  const fetchData = async () => {
    try {
      const [schedData, routeData, helicopterData] = await Promise.all([
        getFlightSchedules(),
        getRoutes(),
        getHelicopters(),
      ]);
      setSchedules(schedData);
      setRoutes(routeData);
      setVessels(helicopterData);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load schedules");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (schedule?: FlightSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({ ...schedule });
    } else {
      setEditingSchedule(null);
      setFormData({
        helicopterId: "",
        originId: "",
        destinationId: "",
        departureTime: "08:00",
        durationMinutes: 60,
        frequency: "Daily",
        daysOfWeek: "",
        isActive: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSchedule(null);
  };

  const handleDayToggle = (day: string) => {
    const currentDays = formData.daysOfWeek
      ? formData.daysOfWeek.split(",")
      : [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    // Maintain order
    const sortedDays = DAYS_OF_WEEK.filter((d) => newDays.includes(d)).join(
      ",",
    );
    setFormData((prev) => ({ ...prev, daysOfWeek: sortedDays }));
  };

  const handleSubmit = async () => {
    try {
      if (editingSchedule?.scheduleId) {
        await updateFlightSchedule(editingSchedule.scheduleId, formData);
        toast.success("Schedule updated successfully");
      } else {
        await createFlightSchedule(formData);
        toast.success("Schedule created successfully");
      }
      handleClose();
      fetchData();
    } catch (error) {
      console.error("Failed to save schedule", error);
      toast.error("Failed to save schedule");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this schedule?"))
      return;
    try {
      await deleteFlightSchedule(id);
      toast.success("Schedule deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  return (
    <Box sx={{ p: 4, bgcolor: "var(--bg)", minHeight: "100vh" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: "var(--text)" }}
          >
            Flight Schedules
          </Typography>
          <Typography variant="body1" sx={{ color: "var(--text-secondary)" }}>
            Configure recurring flight routes and frequencies
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={fetchData}
            sx={{ borderRadius: "8px" }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpen()}
            className="btn-primary-gradient"
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          >
            Add Schedule
          </Button>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        className="glass-panel"
        sx={{ borderRadius: "16px" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vessel</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Timing</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="var(--text-secondary)">
                    No flight schedules configured yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((s) => (
                <TableRow
                  key={s.scheduleId}
                  sx={{ "&:hover": { bgcolor: "var(--panel-hover)" } }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography fontWeight={600}>{s.originName}</Typography>
                      <ArrowRight size={14} color="var(--text-secondary)" />
                      <Typography fontWeight={600}>
                        {s.destinationName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Plane size={16} color="var(--accent)" />
                      <Typography>{s.helicopterName}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.frequency}
                      size="small"
                      sx={{
                        bgcolor:
                          s.frequency === "Daily"
                            ? "var(--accent-alpha)"
                            : "var(--success-alpha)",
                        color:
                          s.frequency === "Daily"
                            ? "var(--accent)"
                            : "var(--success)",
                        fontWeight: 700,
                      }}
                    />
                    {s.frequency === "Weekly" && s.daysOfWeek && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        {s.daysOfWeek}
                      </Typography>
                    )}
                    {s.frequency === "Monthly" && s.dayOfMonth && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 0.5 }}
                      >
                        Day {s.dayOfMonth}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Clock size={16} color="var(--text-secondary)" />
                      <Typography>{s.departureTime.substring(0, 5)}</Typography>
                      <Typography
                        variant="caption"
                        color="var(--text-secondary)"
                      >
                        ({s.durationMinutes}m)
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={s.isActive ? "success" : "default"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpen(s)}>
                      <Edit2 size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(s.scheduleId!)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingSchedule ? "Edit Flight Schedule" : "New Flight Schedule"}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Helicopter"
                value={formData.helicopterId}
                onChange={(e) =>
                  setFormData({ ...formData, helicopterId: e.target.value })
                }
              >
                {vessels.map((v) => (
                  <MenuItem key={v.helicopterId} value={v.helicopterId}>
                    {v.helicopterName} ({v.helicopterId})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                }
                label="Active Status"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Origin"
                value={formData.originId}
                onChange={(e) =>
                  setFormData({ ...formData, originId: e.target.value })
                }
              >
                {routes.map((r) => (
                  <MenuItem key={r.routeId} value={r.routeId}>
                    {r.route}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Destination"
                value={formData.destinationId}
                onChange={(e) =>
                  setFormData({ ...formData, destinationId: e.target.value })
                }
              >
                {routes.map((r) => (
                  <MenuItem key={r.routeId} value={r.routeId}>
                    {r.route}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="time"
                label="Departure Time"
                value={formData.departureTime}
                onChange={(e) =>
                  setFormData({ ...formData, departureTime: e.target.value })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Duration (min)"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationMinutes: parseInt(e.target.value),
                  })
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Frequency"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as any })
                }
              >
                <MenuItem value="Daily">Daily</MenuItem>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
              </TextField>
            </Grid>

            {formData.frequency === "Weekly" && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Days of Week
                </Typography>
                <FormGroup row>
                  {DAYS_OF_WEEK.map((day) => (
                    <FormControlLabel
                      key={day}
                      control={
                        <Checkbox
                          checked={formData.daysOfWeek?.includes(day) || false}
                          onChange={() => handleDayToggle(day)}
                        />
                      }
                      label={day}
                    />
                  ))}
                </FormGroup>
              </Grid>
            )}

            {formData.frequency === "Monthly" && (
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Day of Month"
                  value={formData.dayOfMonth || 1}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dayOfMonth: parseInt(e.target.value),
                    })
                  }
                  inputProps={{ min: 1, max: 31 }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            className="btn-primary-gradient"
            disabled={
              !formData.helicopterId ||
              !formData.originId ||
              !formData.destinationId
            }
          >
            {editingSchedule ? "Save Changes" : "Create Schedule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
