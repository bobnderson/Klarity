import {
  Grid,
  TextField,
  MenuItem,
  Box,
  Chip,
  Paper,
  Typography,
} from "@mui/material";
import { Ship, Plane } from "lucide-react";
import type { UnifiedVessel } from "../../../types/maritime/marine";

interface VesselSelectorProps {
  isAviation: boolean;
  vesselId: string;
  vessels: UnifiedVessel[];
  onVesselChange: (vesselId: string) => void;
  selectedVesselObj?: UnifiedVessel;
}

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

export function VesselSelector({
  isAviation,
  vesselId,
  vessels,
  onVesselChange,
  selectedVesselObj,
}: VesselSelectorProps) {
  return (
    <>
      <Grid size={{ xs: 12 }}>
        <TextField
          select
          fullWidth
          label={isAviation ? "Helicopter" : "Vessel"}
          value={vesselId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onVesselChange(e.target.value)
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
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              {isAviation ? "AIRCRAFT SPECIFICATIONS" : "VESSEL SPECIFICATIONS"}
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
    </>
  );
}
