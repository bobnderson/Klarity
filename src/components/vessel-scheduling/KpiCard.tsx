import { Box, Paper, Typography } from "@mui/material";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string | number;
    isUp: boolean;
    color: "success" | "error" | "info" | "warning";
  };
  icon?: LucideIcon;
  bgColor?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  bgColor = "var(--primary)",
}: KpiCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: bgColor,
        color: "white",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 120,
        flex: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Typography
          variant="caption"
          sx={{ opacity: 0.9, fontWeight: 500, textTransform: "uppercase" }}
        >
          {title}
        </Typography>
        {Icon && <Icon size={18} style={{ opacity: 0.8 }} />}
      </Box>

      <Box sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value}
          {unit && (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 0.5, opacity: 0.8 }}
            >
              {unit}
            </Typography>
          )}
        </Typography>
      </Box>

      {trend && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "rgba(255, 255, 255, 0.2)",
            p: "2px 8px",
            borderRadius: 10,
            width: "fit-content",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {trend.isUp ? "+" : "-"} {trend.value}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
            {trend.isUp ? "↑" : "↓"}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
