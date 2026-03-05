import { useState, useEffect } from "react";
import { Box, Typography, Grid } from "@mui/material";
import type {
  Vessel,
  Voyage,
  UnifiedVessel,
  UnifiedVoyage,
  Helicopter,
} from "../../types/maritime/marine";
import type { Flight } from "../../types/aviation/flight";
import type { MovementRequest } from "../../types/maritime/logistics";
import { HelicopterView2D } from "./HelicopterView2D";
import { formatNumber } from "../../utils/formatters";
import { getVoyageManifest } from "../../services/maritime/voyageService";
import { toast } from "react-toastify";

interface HelicopterLayoutProps {
  vessel: UnifiedVessel | undefined;
  voyage: UnifiedVoyage | undefined;
}

export function HelicopterLayout({ vessel, voyage }: HelicopterLayoutProps) {
  const [manifest, setManifest] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchManifest = async () => {
      const voyageId =
        (voyage as Voyage)?.voyageId || (voyage as Flight)?.flightId;
      if (!voyageId) return;
      setLoading(true);
      try {
        const data = await getVoyageManifest(voyageId);
        setManifest(data);
      } catch (error) {
        console.error("Failed to fetch manifest:", error);
        toast.error("Failed to load deck items");
      } finally {
        setLoading(false);
      }
    };
    fetchManifest();
  }, [
    (voyage as Voyage)?.voyageId || (voyage as Flight)?.flightId,
    (voyage as Voyage)?.weightUtil || (voyage as Flight)?.payloadUtil,
    voyage?.cabinUtil,
  ]);

  if (!vessel || !voyage) return null;

  const voyageId = (voyage as Voyage).voyageId || (voyage as Flight).flightId;
  const weightUtil =
    (voyage as Voyage).weightUtil ?? (voyage as Flight).payloadUtil ?? 0;
  const cabinUtil = voyage.cabinUtil || 0;
  const paxCapacity =
    (vessel as Helicopter).passengerSeats ||
    (vessel as Vessel).capacities?.totalComplement ||
    0;

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
                <span>{formatNumber(weightUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Seat Utilisation</span>
                <span>{formatNumber(cabinUtil, 1)}%</span>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <span>Pax Count</span>
                <span>
                  {manifest.reduce((sum, req) => {
                    const items = req.items?.filter(
                      (i) =>
                        i.assignedVoyageId === voyageId &&
                        i.categoryId === "personnel",
                    );
                    return (
                      sum +
                      (items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0)
                    );
                  }, 0)}
                  {" / "}
                  {paxCapacity}
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
