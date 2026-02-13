import { Box, Typography } from "@mui/material";

export function InsightsVessel() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography sx={{ fontSize: 11, color: "var(--muted)", mb: 0.5 }}>
        Vessel Fleet Status
      </Typography>

      <Box className="queue-item-card" sx={{ p: 1, cursor: "default" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>MV Atlas</span>
          <span
            className="queue-tag"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            En Route
          </span>
        </Box>
        <Box
          sx={{
            fontSize: 10,
            color: "var(--muted)",
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
          }}
        >
          <span>ETA FPSO Alpha: 04:30 (Tomorrow)</span>
          <span>Fuel: 78% · Efficiency: Optimal</span>
        </Box>
      </Box>

      <Box className="queue-item-card" sx={{ p: 1, cursor: "default" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <span style={{ fontSize: 12, fontWeight: 500 }}>MV Horizon</span>
          <span
            className="queue-tag"
            style={{ borderColor: "var(--warning)", color: "var(--warning)" }}
          >
            In Port
          </span>
        </Box>
        <Box
          sx={{
            fontSize: 10,
            color: "var(--muted)",
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
          }}
        >
          <span>Scheduled Departure: 22:00 (Today)</span>
          <span>Fuel: 92% · Low priority maintenance due</span>
        </Box>
      </Box>

      <Box
        className="queue-item-card"
        sx={{ p: 1, cursor: "default", borderLeft: "2px solid var(--danger)" }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
          <span
            style={{ fontSize: 11, fontWeight: 500, color: "var(--danger)" }}
          >
            Alert: MV Galaxy
          </span>
        </Box>
        <span style={{ fontSize: 10, color: "var(--muted)" }}>
          Unexpected thruster vibation detected. Scheduling inspection for next
          port call.
        </span>
      </Box>
    </Box>
  );
}
