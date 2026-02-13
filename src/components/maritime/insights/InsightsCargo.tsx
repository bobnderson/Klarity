import { Box, Typography } from "@mui/material";

export function InsightsCargo() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography sx={{ fontSize: 11, color: "var(--muted)", mb: 0.5 }}>
        Cargo Logistics Overview
      </Typography>

      <Box className="queue-item-card" sx={{ p: 1, cursor: "default" }}>
        <span
          className="chip-label"
          style={{ fontSize: 10, marginBottom: "4px" }}
        >
          Cargo Mix - This Week
        </span>
        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 4,
                bgcolor: "var(--accent)",
                borderRadius: 1,
                mb: 0.5,
              }}
            />
            <span style={{ fontSize: 9, color: "var(--muted)" }}>
              64% Gen Cargo
            </span>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 4,
                bgcolor: "var(--warning)",
                borderRadius: 1,
                mb: 0.5,
              }}
            />
            <span style={{ fontSize: 9, color: "var(--muted)" }}>
              22% Hazmat
            </span>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                height: 4,
                bgcolor: "var(--success)",
                borderRadius: 1,
                mb: 0.5,
              }}
            />
            <span style={{ fontSize: 9, color: "var(--muted)" }}>
              14% Personnel
            </span>
          </Box>
        </Box>
      </Box>

      <Box className="queue-item-card" sx={{ p: 1, cursor: "default" }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            display: "block",
            marginBottom: "4px",
          }}
        >
          Pending Manifests
        </span>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
            }}
          >
            <span>MAN-4902 (FPSO Alpha)</span>
            <span style={{ color: "var(--accent)" }}>Awaiting Sign-off</span>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
            }}
          >
            <span>MAN-4905 (MV Horizon)</span>
            <span style={{ color: "var(--muted)" }}>In Preparation</span>
          </Box>
        </Box>
      </Box>

      <Box
        className="queue-item-card"
        sx={{ p: 1, cursor: "default", borderLeft: "2px solid var(--warning)" }}
      >
        <span
          style={{ fontSize: 10, fontWeight: 500, color: "var(--warning)" }}
        >
          Urgent: Oversized Load
        </span>
        <p style={{ fontSize: 9, color: "var(--muted)", margin: "4px 0 0 0" }}>
          REQ-1207 (4t Pump) requires special crane setup. Verification pending
          for MV Atlas deck strength.
        </p>
      </Box>
    </Box>
  );
}
