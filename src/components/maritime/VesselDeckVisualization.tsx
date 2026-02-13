import { Box, Typography, Grid } from "@mui/material";

interface VesselDeckVisualizationProps {
  loa: number;
  breadth: number;
  fuelOil?: number;
  drillWater?: number;
  liquidMud?: number;
  dryBulkMud?: number;
  potableWater?: number;
  deckArea?: number;
  deckLoad?: number;
}

export function VesselDeckVisualization({
  loa,
  breadth,
  fuelOil,
  drillWater,
  liquidMud,
  dryBulkMud,
  potableWater,
  deckArea,
  deckLoad,
}: VesselDeckVisualizationProps) {
  // Safe defaults
  const safeLoa = Math.max(loa, 1);
  const safeBreadth = Math.max(breadth, 1);
  const aspectRatio = safeLoa / safeBreadth;

  const renderTank = (
    label: string,
    value: number | undefined,
    color: string,
    bgColor: string,
  ) => {
    if (!value) return null;
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 0.5,
          width: "100%",
          height: "100%",
        }}
      >
        <Box
          sx={{
            width: "90%",
            height: "80%",
            bgcolor: bgColor,
            border: `1px solid ${color}`,
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontSize: 8,
              color: color,
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            {label}
            <br />
            {value}m³
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "var(--bg)",
        borderRadius: 2,
        border: "1px solid var(--border)",
        p: 2,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 12,
          fontSize: 10,
          color: "var(--muted)",
          display: "flex",
          gap: 2,
        }}
      >
        <span>
          LOA: <strong>{safeLoa}m</strong>
        </span>
        <span>
          Beam: <strong>{safeBreadth}m</strong>
        </span>
        <span>
          Ratio: <strong>{aspectRatio.toFixed(1)}</strong>
        </span>
      </Box>

      {/* Grid Background */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.1,
          pointerEvents: "none",
        }}
      />

      {/* The Vessel Container */}
      <Box
        sx={{
          // Horizontal Ship
          height: "auto",
          width: "80%",
          maxWidth: "600px",
          aspectRatio: `${aspectRatio} / 1`,
          borderRadius: "6px 100px 100px 6px", // Bow on right
          background: "linear-gradient(90deg, var(--panel) 0%, var(--bg) 100%)",
          position: "relative",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          border: "2px solid var(--border)",
        }}
      >
        {/* Tank / Capacity Area - Dynamic Grid */}
        <Box
          sx={{
            flex: 1,
            borderRight: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            alignContent: "stretch",
          }}
        >
          {/* We use a Grid layout inside the flex container to distribute tanks */}
          <Grid container sx={{ height: "100%", width: "100%" }}>
            <Grid
              size={{ xs: 6 }}
              sx={{
                height: "50%",
                borderBottom: "1px solid var(--border)",
                borderRight: "1px solid var(--border)",
              }}
            >
              {renderTank("FO", fuelOil, "#eab308", "rgba(234, 179, 8, 0.15)")}
            </Grid>
            <Grid
              size={{ xs: 6 }}
              sx={{ height: "50%", borderBottom: "1px solid var(--border)" }}
            >
              {renderTank(
                "DW",
                drillWater,
                "#38bdf8",
                "rgba(56, 189, 248, 0.15)",
              )}
            </Grid>
            <Grid
              size={{ xs: 4 }}
              sx={{ height: "50%", borderRight: "1px solid var(--border)" }}
            >
              {renderTank(
                "LM",
                liquidMud,
                "#a855f7",
                "rgba(168, 85, 247, 0.15)",
              )}
            </Grid>
            <Grid
              size={{ xs: 4 }}
              sx={{ height: "50%", borderRight: "1px solid var(--border)" }}
            >
              {renderTank(
                "DB",
                dryBulkMud,
                "#f97316",
                "rgba(249, 115, 22, 0.15)",
              )}
            </Grid>
            <Grid size={{ xs: 4 }} sx={{ height: "50%" }}>
              {renderTank(
                "PW",
                potableWater,
                "#22c55e",
                "rgba(34, 197, 94, 0.15)",
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Deck Area */}
        <Box
          sx={{
            width: "20%",
            borderRight: "1px solid var(--border)",
            background:
              "repeating-linear-gradient(45deg, var(--border), var(--border) 1px, transparent 1px, transparent 10px)",
            opacity: 0.2,
          }}
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: 9,
                color: "text.secondary",
                transform: "rotate(-90deg)",
              }}
            >
              DECK
              {deckArea ? ` ${deckArea}m²` : ""}
              {deckLoad ? ` ${deckLoad}T/m²` : ""}
            </Typography>
          </Box>
        </Box>

        {/* Bow Area */}
        <Box
          sx={{
            width: "15%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ fontSize: 9, color: "text.disabled" }}
          >
            BOW
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
