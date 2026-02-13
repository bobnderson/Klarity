// src/components/simulation/SimulationMap.tsx

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Tooltip,
} from "react-leaflet";
import { Box, Typography } from "@mui/material";
import { Waves } from "lucide-react";
import L from "leaflet";
import type { SimulationScenario } from "../../types/maritime/simulation";

interface SimulationMapProps {
  scenarios: SimulationScenario[];
  activeScenarioId: string | null;
}

const pickupIcon = L.divIcon({
  className: "pickup-icon",
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#3b82f6;border:2px solid white;"></div>`,
  iconSize: [10, 10],
});

const dropoffIcon = L.divIcon({
  className: "dropoff-icon",
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#f97316;border:2px solid white;"></div>`,
  iconSize: [10, 10],
});

const vesselIcon = L.divIcon({
  className: "vessel-icon",
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#10b981;border:2px solid white;"></div>`,
  iconSize: [12, 12],
});

export function SimulationMap({
  scenarios,
  activeScenarioId,
}: SimulationMapProps) {
  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  if (
    !activeScenario ||
    !activeScenario.path ||
    activeScenario.path.length === 0
  ) {
    return (
      <Box
        sx={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#0f172a",
          position: "relative",
          zIndex: 1,
          px: 4,
          textAlign: "center",
        }}
      >
        {/* Decorative Grid Overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(rgba(14, 165, 233, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 165, 233, 0.05) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            zIndex: -1,
          }}
        />

        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "rgba(14, 165, 233, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#38bdf8",
            mb: 3,
            boxShadow: "0 0 20px rgba(14, 165, 233, 0.1)",
          }}
        >
          <Waves size={40} />
        </Box>

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 1,
            background: "linear-gradient(135deg, #fff, #94a3b8)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            letterSpacing: "-0.5px",
          }}
        >
          Simulation Map Ready
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#64748b",
            maxWidth: 400,
            mx: "auto",
            lineHeight: 1.6,
          }}
        >
          Adjust the heuristics in the sidebar and run the simulation to
          generate optimal offshore routes and routing strategies.
        </Typography>
      </Box>
    );
  }

  const center =
    activeScenario.path[Math.floor(activeScenario.path.length / 2)];
  const polylinePositions = activeScenario.path.map((p) => [p.lat, p.lng]) as [
    number,
    number,
  ][];

  return (
    <Box sx={{ flex: 1, height: "100%", position: "relative" }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={7}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: activeScenario.isOptimal ? "#10b981" : "#3b82f6",
            weight: 4,
          }}
        />

        {activeScenario.stops.map((stop, idx) => {
          const coord = activeScenario.path[idx] || activeScenario.path[0];
          const isPickup = stop.activity === "Load";
          const icon = isPickup ? pickupIcon : dropoffIcon;

          return (
            <Marker
              key={stop.locationId}
              position={[coord.lat, coord.lng]}
              icon={icon}
            >
              <Tooltip>
                <div>
                  <strong>{stop.activity}</strong>
                  <br />
                  {stop.locationName}
                </div>
              </Tooltip>
            </Marker>
          );
        })}

        <Marker
          position={[activeScenario.path[0].lat, activeScenario.path[0].lng]}
          icon={vesselIcon}
        >
          <Tooltip>
            <div>
              <strong>{activeScenario.vesselName}</strong>
              <br />
              Start of route
            </div>
          </Tooltip>
        </Marker>
      </MapContainer>
    </Box>
  );
}
