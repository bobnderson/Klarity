import { useState } from "react";
import { Box, Typography, Popover, IconButton } from "@mui/material";
import { ChevronDown, X } from "lucide-react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

interface HeaderHorizonProps {
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  onApplyDateRange: () => void;
}

export function HeaderHorizon({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  onApplyDateRange,
}: HeaderHorizonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "date-range-popover" : undefined;

  const dateLabel =
    startDate && endDate
      ? `${startDate.format("DD MMM")} - ${endDate.format("DD MMM")}`
      : "Select Dates";

  const isThisWeek =
    startDate?.isSame(dayjs().startOf("isoWeek"), "day") &&
    endDate?.isSame(dayjs().endOf("isoWeek"), "day");

  return (
    <>
      <Box
        className="select-box"
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          "&:hover": { bgcolor: "var(--accent-soft)" },
        }}
      >
        <span className="chip-label">Horizon</span>
        <strong>{isThisWeek ? "This Week" : dateLabel}</strong>
        <ChevronDown size={14} />
      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              boxShadow: "var(--shadow-soft)",
              backgroundImage: "none",
              minWidth: 320,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.5,
            }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              Select Horizon
            </Typography>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "var(--text-secondary)" }}
            >
              <X size={16} />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    "& .MuiInputBase-root": {
                      fontSize: 12,
                      bgcolor: "var(--bg)",
                    },
                  },
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  sx: {
                    "& .MuiInputBase-root": {
                      fontSize: 12,
                      bgcolor: "var(--bg)",
                    },
                  },
                },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <button
              className="btn btn-ghost-custom"
              style={{
                flex: 1,
                fontSize: 11,
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                setStartDate(dayjs().startOf("isoWeek"));
                setEndDate(dayjs().endOf("isoWeek"));
              }}
            >
              This Week
            </button>
            <button
              className="btn btn-primary-gradient"
              style={{
                flex: 1,
                fontSize: 11,
                padding: "8px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                onApplyDateRange();
                handleClose();
              }}
            >
              Apply Range
            </button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
