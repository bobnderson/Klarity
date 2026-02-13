import { Box, Typography, Skeleton, Tooltip } from "@mui/material";
import type { Vessel, Voyage } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";
import { AlertTriangle } from "lucide-react";
import { formatNumber } from "../../utils/formatters";

interface DeckView2DProps {
  vessel?: Vessel;
  voyage?: Voyage;
  manifest?: MovementRequest[];
  loading?: boolean;
}

export function DeckView2D({
  vessel,
  voyage,
  manifest = [],
  loading = false,
}: DeckView2DProps) {
  const allItems = manifest.flatMap((req) =>
    req.items.map((item) => ({
      ...item,
      originRequest: req,
    })),
  );

  const isHazardous = allItems.some((i) => i.isHazardous);

  const deckArea = vessel?.capacities?.deckArea || 0;
  const deckUtil = voyage?.deckUtil || 0;
  return (
    <Box
      sx={{
        minHeight: 180,
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        p: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        bgcolor: "var(--panel-alpha, rgba(255, 255, 255, 0.02))",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span>2D Deck View</span>
          {isHazardous && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#f43f5e",
                fontWeight: 600,
                fontSize: 10,
                bgcolor: "rgba(244, 63, 94, 0.1)",
                px: 1,
                py: 0.25,
                borderRadius: 1,
                border: "1px solid rgba(244, 63, 94, 0.2)",
              }}
            >
              <AlertTriangle size={12} />
              HAZARDOUS
            </Box>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <span>
            Deck Space: <strong>{formatNumber(deckArea)} m²</strong>
          </span>
          <span>
            Utilisation: <strong>{formatNumber(deckUtil, 1)}%</strong>
          </span>
        </Box>
      </Box>

      {/* Utilisation Indicator Bar */}
      <Box
        sx={{
          width: "100%",
          height: 6,
          bgcolor: "rgba(255,255,255,0.05)",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <Box
          sx={{
            width: `${deckUtil}%`,
            height: "100%",
            background:
              deckUtil > 90
                ? "linear-gradient(90deg, #f43f5e, #e11d48)"
                : "linear-gradient(90deg, #0ea5e9, #22c55e)",
            transition: "width 0.5s ease-out",
          }}
        />
      </Box>
      <Box
        sx={{
          flex: 1,
          bgcolor: "#0ea5e9", // Fallback
          background: "linear-gradient(135deg, #0ea5e9 0%, #4F97A3 100%)",
          borderRadius: "6px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.05))",
        }}
      >
        <Box className="deck-grid-overlay"></Box>
        <Box className="vessel-scaffold">
          <Box
            className="deck-layout-box"
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px",
              gridTemplateRows: "1fr",
              gap: 1,
            }}
          >
            {/* Cargo Area Container */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {[0, 1].map((half) => {
                // Split items into two groups for Port/Starboard
                const halfItems = allItems.filter(
                  (_, i) => i % 2 === (half === 0 ? 0 : 1),
                );

                return (
                  <Box
                    key={half}
                    sx={{
                      flex: 1,
                      width: "100%",
                      border: "1px dashed var(--border)",
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.01)",
                      overflow: "hidden",
                      position: "relative",
                      display: "flex",
                      flexWrap: "wrap",
                      alignContent: "flex-start",
                      p: 1,
                      gap: 0.5,
                    }}
                  >
                    {loading ? (
                      <Skeleton
                        variant="rectangular"
                        width="100%"
                        height="100%"
                        sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                      />
                    ) : allItems.length > 0 ? (
                      halfItems.map((item, idx) => {
                        let color = "#3b82f6"; // Default Blue
                        const urgency = item.originRequest?.urgency;

                        if (
                          item.isHazardous ||
                          urgency === "Production Critical" ||
                          urgency === "Project Critical" ||
                          urgency === "Urgent" ||
                          urgency === "Production Critical (deferment risk)"
                        ) {
                          color = "#ef4444"; // Red
                        }

                        return (
                          <Tooltip
                            key={item.itemId || idx}
                            title={
                              <Box sx={{ p: 0.5 }}>
                                <Typography
                                  sx={{ fontSize: 10, fontWeight: 700 }}
                                >
                                  {item.description || "Cargo"}
                                </Typography>
                                <Typography sx={{ fontSize: 9, opacity: 0.8 }}>
                                  {item.quantity} {item.unitOfMeasurement} ·{" "}
                                  {item.weight}t
                                </Typography>
                                <Typography sx={{ fontSize: 9, color }}>
                                  {item.originRequest?.urgency || "Routine"}
                                </Typography>
                              </Box>
                            }
                            arrow
                          >
                            <Box
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                bgcolor: color,
                                boxShadow: `0 0 8px ${color}40`,
                                border: "1px solid rgba(255,255,255,0.2)",
                                cursor: "help",
                                transition: "transform 0.2s",
                                "&:hover": {
                                  transform: "scale(1.3)",
                                  zIndex: 10,
                                },
                              }}
                            />
                          </Tooltip>
                        );
                      })
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          opacity: 0.2,
                        }}
                      >
                        <Typography
                          sx={{ fontSize: 10, color: "var(--muted)" }}
                        >
                          {half === 0 ? "Port Side" : "Starboard Side"}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}

              {/* Central Walkway Overlay (Visual) */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 8,
                  right: 258, // Adjust for Cabin + Crane columns
                  height: 20,
                  marginTop: -10,
                  borderTop: "1px dashed var(--border)",
                  borderBottom: "1px dashed var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 9,
                    color: "var(--muted)",
                    letterSpacing: 2,
                    opacity: 0.7,
                  }}
                >
                  WALKWAY
                </Typography>
              </Box>
            </Box>

            {/* Cabin Zone */}
            <Box
              className="deck-cell-unit"
              sx={{
                bgcolor: "var(--panel)",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                fontWeight: 600,
                fontSize: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Cabin
            </Box>

            {/* Crane Zone */}
            <Box className="deck-cell-unit deck-cell-crane">Crane Zone</Box>
          </Box>
          <Box className="vessel-bow">
            <span
              style={{
                fontSize: 9,
                color: "var(--muted)",
                transform: "rotate(90deg)",
              }}
            >
              BOW
            </span>
          </Box>
        </Box>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 30% 40%, rgba(34, 197, 94, 0.15), transparent 55%), radial-gradient(circle at 70% 60%, rgba(248, 113, 113, 0.2), transparent 55%)",
            mixBlendMode: "screen",
          }}
        ></Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#3b82f6",
                boxShadow: "0 0 8px #3b82f640",
              }}
            />
            <Typography sx={{ fontSize: 10, color: "var(--muted)" }}>
              Standard Cargo
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: "#ef4444",
                boxShadow: "0 0 8px #ef444440",
              }}
            />
            <Typography sx={{ fontSize: 10, color: "var(--muted)" }}>
              Critical / Hazardous
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "3px",
                border: "1px dashed var(--border)",
                bgcolor: "rgba(255,255,255,0.05)",
              }}
            />
            <Typography sx={{ fontSize: 10, color: "var(--muted)" }}>
              Cargo Area
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "3px",
                border: "1px solid var(--border)",
                bgcolor: "var(--panel)",
              }}
            />
            <Typography sx={{ fontSize: 10, color: "var(--muted)" }}>
              Cabin
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "3px",
                border: "1px solid #f97316",
                bgcolor: "rgba(249, 115, 22, 0.1)",
              }}
            />
            <Typography sx={{ fontSize: 10, color: "var(--muted)" }}>
              Crane Zone
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
