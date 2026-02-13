import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import type { VesselRoute } from "../../services/maritime/vrpSolver";

interface GanttChartProps {
  routes: VesselRoute[];
  startDate: string;
  endDate: string;
}

const ACTIVITY_COLORS: Record<string, string> = {
  Load: "#f97316", // Orange
  Unload: "#a855f7", // Purple
  "In-Transit": "#16a34a", // Green
};

export function GanttChart({ routes, startDate, endDate }: GanttChartProps) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const totalHours = end.diff(start, "hour");

  const getPosition = (time: string) => {
    const t = dayjs(time);
    const diff = t.diff(start, "hour");
    return (diff / totalHours) * 100;
  };

  return (
    <Box
      sx={{
        overflowX: "auto",
        bgcolor: "white",
        p: 2,
        borderRadius: 1,
        border: "1px solid var(--border)",
      }}
    >
      <Box sx={{ minWidth: 800 }}>
        {/* Header - Days */}
        <Box
          sx={{
            display: "flex",
            borderBottom: "1px solid var(--border)",
            pb: 1,
            mb: 2,
          }}
        >
          <Box sx={{ width: 200, flexShrink: 0 }} />
          <Box sx={{ flex: 1, display: "flex" }}>
            {Array.from({ length: Math.ceil(totalHours / 24) }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  textAlign: "center",
                  borderLeft: i > 0 ? "1px solid var(--border)" : "none",
                  fontSize: "0.75rem",
                  color: "var(--muted)",
                }}
              >
                {start.add(i, "day").format("MMM DD")}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Rows */}
        {routes.map((route) => (
          <Box
            key={route.vesselId}
            sx={{ display: "flex", alignItems: "center", mb: 2, height: 40 }}
          >
            <Box sx={{ width: 200, flexShrink: 0, pr: 2 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "var(--muted)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {route.vesselName}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                position: "relative",
                height: "100%",
                bgcolor: "#f8fafc",
                borderRadius: 1,
              }}
            >
              {/* Transit lines and Stops */}
              {route.stops.map((stop, idx) => {
                const prevStop = idx > 0 ? route.stops[idx - 1] : null;
                const left = getPosition(stop.arrivalTime);
                const width = getPosition(stop.departureTime) - left;

                return (
                  <Box key={idx}>
                    {/* Transit */}
                    {prevStop && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: "50%",
                          left: `${getPosition(prevStop.departureTime)}%`,
                          width: `${left - getPosition(prevStop.departureTime)}%`,
                          height: 8,
                          mt: -0.5,
                          bgcolor: ACTIVITY_COLORS["In-Transit"],
                          borderRadius: 0,
                        }}
                      />
                    )}
                    {/* Activity */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "10%",
                        left: `${left}%`,
                        width: `${Math.max(width, 1)}%`,
                        height: "80%",
                        bgcolor: ACTIVITY_COLORS[stop.activity] || "#cbd5e1",
                        borderRadius: 0.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        "&:hover": { opacity: 0.8 },
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          px: 0.5,
                        }}
                      >
                        {stop.name}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Legend */}
      <Box sx={{ mt: 3, display: "flex", gap: 3, justifyContent: "center" }}>
        {Object.entries(ACTIVITY_COLORS).map(([label, color]) => (
          <Box
            key={label}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Box
              sx={{ width: 12, height: 12, bgcolor: color, borderRadius: 0.5 }}
            />
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, color: "var(--muted)" }}
            >
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
