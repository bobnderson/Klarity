import {
  Box,
  Typography,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemButton,
  Button,
} from "@mui/material";
import dayjs from "dayjs";
import { CheckCircle2, DollarSign, Clock, BarChart3 } from "lucide-react";
interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  isOptimal: boolean;
  score: number;
  cost: number;
  timeHours: number;
  vesselId: string;
  vesselName: string;
  stops: any[];
  path: any[];
}

interface SimulationResultsProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
  onSelectScenario: (id: string) => void;
}

export function SimulationResults({
  scenarios,
  activeScenarioId,
  onSelectScenario,
}: SimulationResultsProps) {
  if (scenarios.length === 0) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          p: 2,
          textAlign: "center",
        }}
      >
        <Typography>Run the simulation to see results.</Typography>
      </Box>
    );
  }

  const optimalScenario = scenarios.find((s) => s.isOptimal);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--bg)",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid var(--border)",
          bgcolor: "var(--panel)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Simulation Results
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {scenarios.length} scenarios generated based on constraints.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        {/* Optimal Recommendation */}
        {optimalScenario && (
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              borderColor: "var(--success)",
              bgcolor: "rgba(34, 197, 94, 0.05)",
              position: "relative",
            }}
          >
            <Chip
              label="Recommended"
              color="success"
              size="small"
              icon={<CheckCircle2 size={14} />}
              sx={{
                position: "absolute",
                top: -12,
                right: 12,
                fontWeight: 600,
              }}
            />
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {optimalScenario.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {optimalScenario.description}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <DollarSign size={16} color="var(--success)" />
                <Typography variant="body2" fontWeight={600}>
                  ${optimalScenario.cost.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Clock size={16} color="var(--accent)" />
                <Typography variant="body2" fontWeight={600}>
                  {optimalScenario.timeHours.toFixed(1)}h
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <BarChart3 size={16} color="var(--primary)" />
                <Typography variant="body2" fontWeight={600}>
                  Score: {optimalScenario.score}
                </Typography>
              </Box>
            </Box>

            <Chip
              label={`Vessel: ${optimalScenario.vesselName || "Best Available"}`}
              color="primary"
              size="small"
              variant="outlined"
              sx={{
                mb: 1,
                width: "100%",
                justifyContent: "flex-start",
                fontWeight: 600,
              }}
            />

            <Button
              variant="contained"
              size="small"
              color="success"
              fullWidth
              onClick={() => onSelectScenario(optimalScenario.id)}
              sx={{ mt: 1 }}
            >
              View Details
            </Button>
          </Paper>
        )}

        <Typography
          variant="subtitle2"
          sx={{
            mb: 1,
            color: "var(--muted)",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          All Scenarios
        </Typography>

        <List disablePadding>
          {scenarios.map((scenario) => (
            <ListItem key={scenario.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={activeScenarioId === scenario.id}
                onClick={() => onSelectScenario(scenario.id)}
                sx={{
                  border: "1px solid var(--border)",
                  borderRadius: 1,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 1,
                  "&.Mui-selected": {
                    borderColor: "var(--accent)",
                    bgcolor: "var(--accent-soft)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    {scenario.name}
                  </Typography>
                  {scenario.isOptimal && (
                    <CheckCircle2 size={16} color="var(--success)" />
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    fontSize: "0.8rem",
                    color: "var(--muted)",
                  }}
                >
                  <span>${scenario.cost.toLocaleString()}</span>
                  <span>•</span>
                  <span>{scenario.timeHours.toFixed(1)}h</span>
                  <span>•</span>
                  <span>Score: {scenario.score}</span>
                </Box>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Details Panel (if active) */}
      {activeScenarioId && (
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid var(--border)",
            bgcolor: "var(--panel)",
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Selected Scenario Details
          </Typography>
          {(() => {
            const selected = scenarios.find((s) => s.id === activeScenarioId);
            if (!selected) return null;
            return (
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={1}
                >
                  Vessel: {selected.vesselName} ({selected.vesselId})
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  Route Path:
                </Typography>
                <List dense>
                  {selected.stops.map((stop, i) => (
                    <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          width: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            bgcolor: "var(--accent)",
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontSize="0.8rem">
                            {stop.locationName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {stop.activity} @{" "}
                            {dayjs(stop.arrival).format("HH:mm")}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            );
          })()}
        </Box>
      )}
    </Box>
  );
}
