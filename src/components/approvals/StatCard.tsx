import { Paper, Box, Typography } from "@mui/material";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: "20px",
        bgcolor: "var(--panel)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 2.5,
      }}
    >
      <Box
        sx={{
          p: 1.5,
          borderRadius: "12px",
          bgcolor: `${color}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          color="var(--text-secondary)"
          fontWeight={600}
        >
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
