import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Slider,
  TextField,
  Switch,
  Button,
  Paper,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import {
  Play,
  Settings2,
  ChevronDown,
  ChevronUp,
  Package,
  StopCircle,
} from "lucide-react";
import type { SimulationConfig } from "../../types/maritime/simulation";
import { getPendingRequests } from "../../services/maritime/marineMovementService";
import type { MovementRequest } from "../../types/maritime/logistics";
import { toast } from "react-toastify";

interface SimulationSidebarProps {
  onRun: (config: SimulationConfig, requests: MovementRequest[]) => void;
  onCancel?: () => void;
  isLoading: boolean;
  progress?: number;
}

export function SimulationSidebar({
  onRun,
  onCancel,
  isLoading,
  progress = 0,
}: SimulationSidebarProps) {
  const [config, setConfig] = useState<SimulationConfig>({
    weatherDelayFactor: 1.0,
    vesselSpeedMultiplier: 1.0,
    emergencyCargoPriorityBoost: 1.5,
    earlyMobilisationWeight: 500,
    fuelCostPerLiter: 1.2,
    maxRouteDistance: 500,
    maxVoyageDuration: 72,
    portCongestionDelay: 2,
  });

  const [pendingRequests, setPendingRequests] = useState<MovementRequest[]>([]);
  const [isManifestOpen, setIsManifestOpen] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requests = await getPendingRequests();
        setPendingRequests(requests);
      } catch (error) {
        console.error("Failed to load requests", error);
        toast.error("Failed to load pending cargo");
      }
    };
    fetchRequests();
  }, []);

  const handleChange = (field: keyof SimulationConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const totalWeight = pendingRequests.reduce(
    (sum, req) => sum + (req.totalWeight || 0),
    0,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: 320,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        bgcolor: "var(--panel)",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "var(--bg-soft)",
        }}
      >
        <Settings2 size={20} color="var(--accent)" />
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem" }}>
          Heuristics Constraints
        </Typography>
      </Box>

      <Box
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          overflowY: "auto",
          flex: 1,
        }}
      >
        {/* Pending Manifest Section */}
        <Box sx={{ border: "1px solid var(--border)", borderRadius: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              cursor: "pointer",
              bgcolor: "var(--bg-soft)",
            }}
            onClick={() => setIsManifestOpen(!isManifestOpen)}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Package size={16} color="var(--text-secondary)" />
              <Typography variant="subtitle2" fontWeight={600}>
                Pending Cargo ({pendingRequests.length})
              </Typography>
            </Box>
            <IconButton size="small">
              {isManifestOpen ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </IconButton>
          </Box>
          <Collapse in={isManifestOpen}>
            <List
              dense
              sx={{ maxHeight: 200, overflowY: "auto", bgcolor: "var(--bg)" }}
            >
              {pendingRequests.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No pending cargo"
                    sx={{ color: "var(--muted)", textAlign: "center" }}
                  />
                </ListItem>
              ) : (
                pendingRequests.map((req) => (
                  <ListItem
                    key={req.requestId}
                    divider
                    sx={{ flexDirection: "column", alignItems: "flex-start" }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <Typography variant="caption" fontWeight={600}>
                            {req.originName || req.originId} →{" "}
                            {req.destinationName || req.destinationId}
                          </Typography>
                          <Typography variant="caption" color="var(--accent)">
                            {req.totalWeight}t
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              fontSize: "0.7rem",
                              display: "block",
                              mb: 0.5,
                            }}
                          >
                            Available:{" "}
                            {new Date(
                              req.earliestDeparture,
                            ).toLocaleDateString()}
                          </Typography>
                          {req.items.map((item, idx) => (
                            <Typography
                              key={idx}
                              variant="caption"
                              display="block"
                              sx={{ color: "text.primary", fontSize: "0.7rem" }}
                            >
                              • {item.quantity} {item.unitOfMeasurement}{" "}
                              {item.description}
                            </Typography>
                          ))}
                        </Box>
                      }
                      sx={{ width: "100%", margin: 0 }}
                    />
                  </ListItem>
                ))
              )}
            </List>
            <Box
              sx={{
                p: 1,
                borderTop: "1px solid var(--border)",
                bgcolor: "var(--bg-soft)",
              }}
            >
              <Typography
                variant="caption"
                display="block"
                textAlign="right"
                fontWeight={600}
              >
                Total Load: {totalWeight.toLocaleString()} tonnes
              </Typography>
            </Box>
          </Collapse>
        </Box>

        {/* Weather Delay Factor */}
        <Box>
          <Typography gutterBottom variant="subtitle2">
            Weather Delay Factor ({(config.weatherDelayFactor * 100).toFixed(0)}
            %)
          </Typography>
          <Slider
            value={config.weatherDelayFactor}
            onChange={(_, val) => handleChange("weatherDelayFactor", val)}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
            min={0.5}
            max={1.0}
            step={0.1}
            sx={{ color: "var(--accent)" }}
          />
          <Typography variant="caption" color="text.secondary">
            100% = No Delay. Lower values increase travel time.
          </Typography>
        </Box>

        {/* Vessel Speed Multiplier */}
        <Box>
          <Typography gutterBottom variant="subtitle2">
            Global Speed Adjustment ({config.vesselSpeedMultiplier}x)
          </Typography>
          <Slider
            value={config.vesselSpeedMultiplier}
            onChange={(_, val) => handleChange("vesselSpeedMultiplier", val)}
            valueLabelDisplay="auto"
            min={0.5}
            max={1.5}
            step={0.1}
            sx={{ color: "var(--accent)" }}
          />
        </Box>

        {/* Port Congestion */}
        <TextField
          label="Port Congestion Delay (hours)"
          type="number"
          size="small"
          fullWidth
          value={config.portCongestionDelay}
          onChange={(e) =>
            handleChange("portCongestionDelay", Number(e.target.value))
          }
          slotProps={{ htmlInput: { min: 0, max: 24 } }}
        />

        {/* Switches */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2">Emergency Cargo Priority</Typography>
            <Switch
              checked={config.emergencyCargoPriorityBoost > 1}
              onChange={(e) =>
                handleChange(
                  "emergencyCargoPriorityBoost",
                  e.target.checked ? 2.0 : 1.0,
                )
              }
              size="small"
            />
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: -0.5 }}
          >
            Boost score for critical cargo (2x multiplier).
          </Typography>
        </Box>

        {/* Progress Indicator if running */}
        {isLoading && (
          <Box sx={{ mt: 2 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="caption">Optimization Progress</Typography>
              <Typography variant="caption">{progress?.toFixed(0)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: "1px solid var(--border)",
          bgcolor: "var(--bg-soft)",
          flexShrink: 0,
          zIndex: 20,
          display: "flex",
          gap: 1,
        }}
      >
        {isLoading && onCancel ? (
          <Button
            variant="outlined"
            color="error"
            fullWidth
            size="large"
            startIcon={<StopCircle size={20} />}
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            size="large"
            className="btn-primary-gradient"
            startIcon={<Play size={20} />}
            onClick={() => onRun(config, pendingRequests)}
            disabled={isLoading}
            sx={{
              "&.Mui-disabled": {
                opacity: 0.7,
              },
            }}
          >
            Run Simulation
          </Button>
        )}
      </Box>
    </Paper>
  );
}
