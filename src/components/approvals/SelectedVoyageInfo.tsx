import { Box, Typography } from "@mui/material";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";
import type { MovementRequest } from "../../types/maritime/logistics";

interface SelectedVoyageInfoProps {
  request: MovementRequest;
}

export function SelectedVoyageInfo({ request }: SelectedVoyageInfoProps) {
  if (!request.selectedVoyageId) return null;

  return (
    <Box
      sx={{
        mb: 4,
        p: 2,
        borderRadius: "12px",
        bgcolor: "var(--accent-soft)",
        border: "1px solid var(--accent)",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Calendar size={20} color="var(--accent)" />
      <Box sx={{ flex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: "var(--accent)",
            fontWeight: 700,
            mb: 0.5,
            display: "block",
          }}
        >
          SELECTED VOYAGE / FLIGHT
        </Typography>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2" fontWeight={800}>
              {request.vesselName || "Unknown Vessel / Flight"}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "var(--text-secondary)" }}
            >
              {request.originName} → {request.destinationName}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right", display: "flex", gap: 3 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--text-secondary)",
                  display: "block",
                }}
              >
                DEPARTURE
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {request.scheduledDeparture
                  ? dayjs(request.scheduledDeparture).format("DD MMM, HH:mm")
                  : "-"}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--text-secondary)",
                  display: "block",
                }}
              >
                ARRIVAL
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {request.scheduledArrival
                  ? dayjs(request.scheduledArrival).format("DD MMM, HH:mm")
                  : "-"}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
