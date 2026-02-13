// src/hooks/useMarineSimulation.ts

import { useEffect, useRef, useState } from "react";
import type {
  SimulationRequest,
  SimulationVessel,
  SimulationConfig,
  SimulationScenario,
} from "../types/maritime/simulation";

export const useMarineSimulation = () => {
  const workerRef = useRef<Worker | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/marineSimulation.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<any>) => {
      const { type, scenarios, progress: p } = event.data;
      if (type === "progress") {
        setProgress(p);
      } else if (type === "complete") {
        setScenarios(scenarios);
        setIsRunning(false);
        setProgress(100);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const run = (
    config: SimulationConfig,
    requests: SimulationRequest[],
    vessels: SimulationVessel[],
  ) => {
    if (!workerRef.current) return;
    setIsRunning(true);
    setProgress(0);
    setScenarios([]);
    workerRef.current.postMessage({
      type: "run",
      payload: { config, requests, vessels },
    });
  };

  const cancel = () => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: "cancel" });
    setIsRunning(false);
    setProgress(0);
  };

  return {
    isRunning,
    progress,
    scenarios,
    run,
    cancel,
  };
};
