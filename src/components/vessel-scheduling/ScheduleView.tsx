import { Box, Button, Paper, Grid } from "@mui/material";
import { KpiCard } from "./KpiCard";
import { GanttChart } from "./GanttChart";
import { SimulationMap } from "../simulation/SimulationMap";
import { solveVRP } from "../../services/maritime/vrpSolver";
import {
  MED_VESSELS,
  MED_PLATFORMS,
} from "../../data/maritime/schedulingScenarios";
import {
  Ship,
  Percent,
  Clock,
  DollarSign,
  Activity,
  Settings2,
  History,
} from "lucide-react";
import { useMemo, useState } from "react";

type ScenarioMode = "Original" | "AntonDaily" | "WeatherSlowdown";

export function ScheduleView() {
  const [mode, setMode] = useState<ScenarioMode>("Original");
  const [isComparing, setIsComparing] = useState(false);

  const stops = useMemo(() => {
    return MED_PLATFORMS.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      activity: "Unload" as const,
      duration: 2,
      demandWeight: mode === "AntonDaily" && p.id === "anton" ? 1000 : 200,
    }));
  }, [mode]);

  const routes = useMemo(() => {
    const options = {
      speedMultiplier: mode === "WeatherSlowdown" ? 0.9 : 1,
    };
    return solveVRP(MED_VESSELS, stops, options);
  }, [mode, stops]);

  const baseRoutes = useMemo(() => {
    const baseStops = MED_PLATFORMS.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.lat,
      lng: p.lng,
      activity: "Unload" as const,
      duration: 2,
      demandWeight: 200,
    }));
    return solveVRP(MED_VESSELS, baseStops);
  }, []);

  const scenarios = useMemo(
    () =>
      routes.map((r, i) => ({
        id: r.vesselId,
        name: `Route for ${r.vesselName}`,
        description: `Optimized route covering ${r.stops.length} stops.`,
        isOptimal: i === 0,
        score: 85,
        cost: r.totalCost,
        timeHours: r.totalDuration,
        vesselId: r.vesselId,
        vesselName: r.vesselName,
        stops: r.stops.map((s) => ({
          locationId: s.id,
          locationName: s.name,
          activity: s.activity === "Unload" ? "Discharge" : ("Load" as any),
          arrival: s.arrivalTime,
          departure: s.departureTime,
        })),
        path: r.path,
      })),
    [routes],
  );

  const totalCost = routes.reduce((sum, r) => sum + r.totalCost, 0);
  const baseCost = baseRoutes.reduce((sum, r) => sum + r.totalCost, 0);
  const costDelta = totalCost - baseCost;

  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#f1f5f9",
      }}
    >
      {/* Header Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid var(--border)",
          borderRadius: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={mode === "Original" ? "contained" : "outlined"}
            size="small"
            onClick={() => {
              setMode("Original");
              setIsComparing(false);
            }}
          >
            Original Schedule
          </Button>
          <Button
            variant={mode === "AntonDaily" ? "contained" : "outlined"}
            size="small"
            color="warning"
            onClick={() => {
              setMode("AntonDaily");
            }}
          >
            Anton Daily
          </Button>
          <Button
            variant={mode === "WeatherSlowdown" ? "contained" : "outlined"}
            size="small"
            color="info"
            onClick={() => {
              setMode("WeatherSlowdown");
            }}
          >
            Weather Slowdown (10%)
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            startIcon={<History size={16} />}
            variant="outlined"
            size="small"
            onClick={() => setIsComparing(!isComparing)}
          >
            {isComparing ? "Hide Comparison" : "Compare Scenarios"}
          </Button>
          <Button
            startIcon={<Settings2 size={16} />}
            variant="outlined"
            size="small"
          >
            Optimization Settings
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
          <KpiCard
            title="Vessels Used"
            value={routes.length}
            trend={
              isComparing
                ? {
                    value: routes.length - baseRoutes.length,
                    isUp: routes.length > baseRoutes.length,
                    color: "error",
                  }
                : undefined
            }
            icon={Ship}
            bgColor="#0284c7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
          <KpiCard
            title="Single Trips"
            value={routes.filter((r) => r.stops.length === 1).length}
            icon={Activity}
            bgColor="#0284c7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
          <KpiCard
            title="Service Level"
            value="100%"
            icon={Percent}
            bgColor="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
          <KpiCard
            title="Travel Time"
            value={`${Math.round(routes.reduce((s, r) => s + r.totalDuration, 0))}h`}
            icon={Clock}
            bgColor="#0284c7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
          <KpiCard
            title="Idle Time"
            value="42h"
            icon={Clock}
            bgColor="#f59e0b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <KpiCard
            title="Efficiency"
            value={`${Math.round(85 - routes.length * 2)}%`}
            icon={Activity}
            bgColor="#1e293b"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 2.5 }}>
          <KpiCard
            title="Total Cost"
            value={`$${Math.round(totalCost).toLocaleString()}`}
            trend={
              isComparing && costDelta !== 0
                ? {
                    value: `$${Math.abs(Math.round(costDelta)).toLocaleString()}`,
                    isUp: costDelta > 0,
                    color: "error",
                  }
                : undefined
            }
            icon={DollarSign}
            bgColor="#1e293b"
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: 2,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            minHeight: 0,
          }}
        >
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <GanttChart
              routes={routes}
              startDate={new Date().toISOString()}
              endDate={new Date(Date.now() + 7 * 24 * 3600000).toISOString()}
            />
          </Box>
        </Box>
        <Paper
          elevation={0}
          sx={{
            border: "1px solid var(--border)",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <SimulationMap
            scenarios={scenarios}
            activeScenarioId={scenarios.length > 0 ? scenarios[0].id : null}
          />
        </Paper>
      </Box>
    </Box>
  );
}
