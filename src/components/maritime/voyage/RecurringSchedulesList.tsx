import {
  Grid,
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  IconButton,
} from "@mui/material";
import { Trash2 } from "lucide-react";

interface RecurringSchedulesListProps {
  existingSchedules: any[];
  editingScheduleId: string | null;
  onEditSchedule: (schedule: any) => void;
  onDeleteSchedule: (id: string) => void;
}

export function RecurringSchedulesList({
  existingSchedules,
  editingScheduleId,
  onEditSchedule,
  onDeleteSchedule,
}: RecurringSchedulesListProps) {
  if (existingSchedules.length === 0) return null;

  return (
    <Grid size={{ xs: 12 }}>
      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        Existing Schedules
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {existingSchedules.map((schedule) => (
          <Paper
            key={schedule.scheduleId}
            variant="outlined"
            sx={{
              p: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor:
                editingScheduleId === schedule.scheduleId
                  ? "var(--accent-soft)"
                  : "transparent",
              borderColor:
                editingScheduleId === schedule.scheduleId
                  ? "var(--accent)"
                  : "var(--border)",
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {schedule.vesselName || schedule.vesselId}
              </Typography>
              <Typography variant="caption" color="var(--muted)">
                {schedule.originName || schedule.originId} →{" "}
                {schedule.destinationName || schedule.destinationId} |{" "}
                {schedule.frequency} @ {schedule.departureTime.substring(0, 5)}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                onClick={() => onEditSchedule(schedule)}
                disabled={editingScheduleId === schedule.scheduleId}
              >
                Edit
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDeleteSchedule(schedule.scheduleId)}
              >
                <Trash2 size={14} />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>
    </Grid>
  );
}
