import { Grid, Box } from "@mui/material";
import { Clock, AlertCircle, Ship, Plane } from "lucide-react";
import { StatCard } from "./StatCard";
import type { MovementRequest } from "../../types/maritime/logistics";

interface ApprovalStatsProps {
  requests: MovementRequest[];
}

export function ApprovalStats({ requests }: ApprovalStatsProps) {
  const stats = {
    pending: requests.length,
    urgent: requests.filter(
      (r) =>
        r.urgencyId?.includes("urgent") || r.urgencyId?.includes("priority"),
    ).length,
    marine: requests.filter((r: any) => r.transportationMode === "Marine")
      .length,
    aviation: requests.filter((r: any) => r.transportationMode === "Aviation")
      .length,
  };

  return (
    <Box sx={{ px: 3, pt: 3, pb: 1 }}>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Clock size={24} color="#f59e0b" />}
            label="Pending Action"
            value={stats.pending}
            color="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<AlertCircle size={24} color="#ef4444" />}
            label="Urgent Requests"
            value={stats.urgent}
            color="#ef4444"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Ship size={24} color="var(--accent)" />}
            label="Marine Requests"
            value={stats.marine}
            color="var(--accent)"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Plane size={24} color="#10b981" />}
            label="Aviation Requests"
            value={stats.aviation}
            color="#10b981"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
