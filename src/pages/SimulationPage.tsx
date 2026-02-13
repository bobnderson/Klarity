import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { SimulationSidebar } from "../components/simulation/SimulationSidebar";
import { SimulationMap } from "../components/simulation/SimulationMap";
import { SimulationResults } from "../components/simulation/SimulationResults";
import { useMarineSimulation } from "../hooks/useMarineSimulation";
import type {
  SimulationConfig,
  SimulationRequest,
} from "../types/maritime/simulation";
import type { MovementRequest } from "../types/maritime/logistics";
import { MOCK_VESSELS } from "../data/maritime/masterData";

const mapResultsToScenarios = (results: any[]) => {
  return results.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isOptimal: r.isOptimal,
    score: r.score,
    cost: r.cost,
    timeHours: r.timeHours,
    vesselId: r.vesselId,
    vesselName: r.vesselName,
    stops: r.stops,
    path: r.path,
  }));
};

const mapUrgency = (u?: string): SimulationRequest["urgencyLevel"] => {
  switch (u) {
    case "Urgent":
    case "critical":
      return "critical";
    case "Priority":
    case "high":
      return "high";
    case "Routine":
    case "medium":
    default:
      return "medium";
  }
};

export function SimulationPage() {
  const { run, cancel, scenarios, isRunning, progress } = useMarineSimulation();
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const handleRunSimulation = (
    config: SimulationConfig,
    requests: MovementRequest[],
  ) => {
    const vessels: any[] = MOCK_VESSELS;

    const simRequests: SimulationRequest[] = requests.map((r) => ({
      requestId: r.requestId,
      pickupLocation: { lat: 4.5, lng: 7.0 }, // mock origin for now
      dropoffLocation: { lat: 6.4, lng: 3.4 }, // mock destination for now
      cargoWeight: r.totalWeight ?? 0,
      cargoVolume: undefined,
      deckSpaceRequired: undefined,
      cargoDimensions: undefined,
      hazardClass: r.isHazardous ? "Hazardous" : undefined,
      urgencyLevel: mapUrgency(r.urgency),
      earliestPickupTime: r.earliestDeparture ?? new Date().toISOString(),
      latestDropoffTime: r.latestArrival ?? new Date().toISOString(),
      loadingDuration: 2,
      unloadingDuration: 2,
      earlyMobilisationRequired: false,
      requiresSpecialHandling: !!r.isHazardous,
      personnelCount: undefined,
    }));

    run(config, simRequests, vessels);
  };

  useEffect(() => {
    if (scenarios.length > 0 && !activeScenarioId) {
      setActiveScenarioId(scenarios[0].id);
    }
  }, [scenarios, activeScenarioId]);

  return (
    <Box
      sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}
    >
      <SimulationSidebar
        onRun={handleRunSimulation}
        onCancel={cancel}
        isLoading={isRunning}
        progress={progress}
      />

      <Box sx={{ flex: 1, position: "relative" }}>
        <SimulationMap
          scenarios={mapResultsToScenarios(scenarios)}
          activeScenarioId={activeScenarioId}
        />
      </Box>

      <Box
        sx={{
          width: 360,
          borderLeft: "1px solid var(--border)",
          bgcolor: "var(--panel)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SimulationResults
          scenarios={mapResultsToScenarios(scenarios)}
          activeScenarioId={activeScenarioId}
          onSelectScenario={setActiveScenarioId}
        />
      </Box>
    </Box>
  );
}
