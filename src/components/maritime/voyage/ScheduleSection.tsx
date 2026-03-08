import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

interface ScheduleSectionProps {
  isRecurring: boolean;
  isAviation: boolean;
  departureDateTime: dayjs.Dayjs;
  eta: dayjs.Dayjs;
  scheduleData: {
    frequency: string;
    daysOfWeek: string;
    dayOfMonth: number;
    departureTime: string;
    durationDays: number;
  };
  onDepartureChange: (val: dayjs.Dayjs) => void;
  onEtaChange: (val: dayjs.Dayjs) => void;
  onScheduleDataChange: (data: any) => void;
  onDayToggle: (day: string) => void;
}

const inputSx = {
  "& .MuiInputBase-root": { fontSize: "0.875rem" },
  "& .MuiInputLabel-root": { fontSize: "0.875rem" },
};

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ScheduleSection({
  isRecurring,
  isAviation,
  departureDateTime,
  eta,
  scheduleData,
  onDepartureChange,
  onEtaChange,
  onScheduleDataChange,
  onDayToggle,
}: ScheduleSectionProps) {
  if (!isRecurring) {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid size={{ xs: 4 }}>
          <DateTimePicker
            label="Departure Date & Time"
            value={departureDateTime}
            onChange={(newValue) => onDepartureChange(newValue || dayjs())}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small",
                sx: inputSx,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <DateTimePicker
            label={isAviation ? "Arrival Time" : "ETA"}
            value={eta}
            onChange={(newValue) => onEtaChange(newValue || dayjs())}
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
    );
  }

  return (
    <>
      <Grid size={{ xs: 4 }}>
        <TextField
          fullWidth
          type="time"
          label="Departure Time"
          value={scheduleData.departureTime}
          onChange={(e) =>
            onScheduleDataChange({
              ...scheduleData,
              departureTime: e.target.value,
            })
          }
          InputLabelProps={{ shrink: true }}
          size="small"
          sx={inputSx}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField
          fullWidth
          type="number"
          label="Duration (Days)"
          value={scheduleData.durationDays}
          onChange={(e) =>
            onScheduleDataChange({
              ...scheduleData,
              durationDays: parseInt(e.target.value) || 1,
            })
          }
          size="small"
          sx={inputSx}
        />
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField
          select
          fullWidth
          label="Frequency"
          value={scheduleData.frequency}
          onChange={(e) =>
            onScheduleDataChange({ ...scheduleData, frequency: e.target.value })
          }
          size="small"
          sx={inputSx}
        >
          <MenuItem value="Daily">Daily</MenuItem>
          <MenuItem value="Weekly">Weekly</MenuItem>
          <MenuItem value="Monthly">Monthly</MenuItem>
        </TextField>
      </Grid>

      {scheduleData.frequency === "Weekly" && (
        <Grid size={{ xs: 12 }}>
          <Typography
            variant="caption"
            sx={{ mb: 1, fontWeight: 600, color: "var(--muted)" }}
          >
            Days of Week
          </Typography>
          <FormGroup row>
            {DAYS_OF_WEEK.map((day) => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    size="small"
                    checked={scheduleData.daysOfWeek?.includes(day) || false}
                    onChange={() => onDayToggle(day)}
                  />
                }
                label={
                  <Typography sx={{ fontSize: "0.875rem" }}>{day}</Typography>
                }
              />
            ))}
          </FormGroup>
        </Grid>
      )}

      {scheduleData.frequency === "Monthly" && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            type="number"
            label="Day of Month"
            value={scheduleData.dayOfMonth || 1}
            onChange={(e) =>
              onScheduleDataChange({
                ...scheduleData,
                dayOfMonth: parseInt(e.target.value),
              })
            }
            inputProps={{ min: 1, max: 31 }}
            size="small"
            sx={inputSx}
          />
        </Grid>
      )}
    </>
  );
}
