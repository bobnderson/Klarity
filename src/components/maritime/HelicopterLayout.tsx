import { useState, useEffect } from "react";
import { Box, Typography, Grid } from "@mui/material";
import type { Vessel, Voyage } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";
import { HelicopterView2D } from "./HelicopterView2D";
import { formatNumber } from "../../utils/formatters";
import { getVoyageManifest } from "../../services/maritime/voyageService";
import { toast } from "react-toastify";

interface HelicopterLayoutProps {
  vessel: Vessel | undefined;
  voyage: Voyage | undefined;
}

export function HelicopterLayout({ vessel, voyage }: HelicopterLayoutProps) {
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
          <span>Helicopter Layout & Config</span>
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
                <span>Payload Utilisation</span>
                <span>{formatNumber(voyage.weightUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Seat Utilisation</span>
                <span>{formatNumber(voyage.cabinUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pax Count</span>
                <span>
                  {manifest.reduce((sum, req) => {
                    const items = req.items?.filter(
                      (i) =>
                        i.assignedVoyageId === voyage.voyageId &&
                        i.categoryId === "personnel",
                    );
                    return (
                      sum +
                      (items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0)
                    );
                  }, 0)}
                  {" / "}
                  {vessel.capacities?.totalComplement || 0}
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
                Visualize passenger seating and cargo configuration.
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 9 }} sx={{ height: "100%" }}>
          <HelicopterView2D
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
