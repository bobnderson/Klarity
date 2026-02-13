// src/workers/marineSimulation.worker.ts
/// <reference lib="webworker" />

import { runSimulation } from "../services/maritime/simulationService";
import type {
  SimulationRequest,
  SimulationVessel,
  SimulationConfig,
} from "../types/maritime/simulation";

interface WorkerRunPayload {
  config: SimulationConfig;
  requests: SimulationRequest[];
  vessels: SimulationVessel[];
}

interface WorkerMessage {
  type: "run" | "cancel";
  payload?: WorkerRunPayload;
}

let cancelled = false;

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  console.log("Worker loaded");

  if (type === "cancel") {
    cancelled = true;
    return;
  }

  if (type === "run" && payload) {
    cancelled = false;
    const { config, requests, vessels } = payload;

    const scenarios = await runSimulation(
      config,
      requests,
      vessels,
      (progress) => {
        if (!cancelled) {
          (self as any).postMessage({ type: "progress", progress });
        }
      },
    );

    if (!cancelled) {
      (self as any).postMessage({ type: "complete", scenarios });
    }
  }
};
