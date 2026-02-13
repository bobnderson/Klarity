import { useState, useEffect } from "react";
import { Box, Typography, Grid } from "@mui/material";
import type { Vessel, Voyage } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";
import { DeckView2D } from "./DeckView2D";
import { formatNumber } from "../../utils/formatters";
import { getVoyageManifest } from "../../services/maritime/voyageService";
import { toast } from "react-toastify";

interface VesselDeckLayoutProps {
  vessel: Vessel | undefined;
  voyage: Voyage | undefined;
}

export function VesselDeckLayout({ vessel, voyage }: VesselDeckLayoutProps) {
  const [manifest, setManifest] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchManifest = async () => {
      if (!voyage?.voyageId) return;
      setLoading(true);
      try {
        const data = await getVoyageManifest(voyage.voyageId);
        setManifest(data);
      } catch (error) {
        console.error("Failed to fetch manifest:", error);
        toast.error("Failed to load deck items");
      } finally {
        setLoading(false);
      }
    };
    fetchManifest();
  }, [voyage?.voyageId, voyage?.weightUtil, voyage?.deckUtil]);

  if (!vessel || !voyage) return null;

  return (
    <section className="panel-container deck-layout-section">
      <Box className="panel-header-custom">
        <Box className="panel-title-custom">
          <span className="panel-title-dot"></span>
          <span>Deck Layout & Vessel Detail</span>
        </Box>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          {vessel.vesselName} · {voyage.originName || voyage.originId} →{" "}
          {voyage.destinationName || voyage.destinationId}
        </span>
      </Box>
      <Grid
        container
        spacing={1.25}
        sx={{ height: "auto", flex: 1, minHeight: 0 }}
      >
        <Grid size={{ xs: 3 }}>
          <Box className="panel-body-scroll">
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                fontSize: 11,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Weight Utilisation</span>
                <span>{formatNumber(voyage.weightUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Deck Utilisation</span>
                <span>{formatNumber(voyage.deckUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cabin Utilisation</span>
                <span>{formatNumber(voyage.cabinUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Hazardous Units</span>
                <span>
                  {voyage.cargoDistribution.find((c) => c.type === "hazardous")
                    ?.value || 0}{" "}
                  units
                </span>
              </Box>

              <Typography
                sx={{
                  mt: 1,
                  fontSize: 11,
                  color: "var(--muted)",
                  lineHeight: 1.4,
                }}
              >
                Drag cargo blocks within the deck view to adjust positions.
                Collision and restricted zone checks run in real time.
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 9 }} sx={{ height: "100%" }}>
          <DeckView2D
            vessel={vessel}
            voyage={voyage}
            manifest={manifest}
            loading={loading}
          />
        </Grid>
      </Grid>
    </section>
  );
}
