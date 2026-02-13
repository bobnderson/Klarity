import {
  Box,
  Typography,
  Grid,
  Button,
  Collapse,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Hash,
  Weight,
  Square,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Vessel } from "../../../types/maritime/marine";
import type { MovementRequest } from "../../../types/maritime/logistics";
import type {
  RecommendationSummary,
  VoyageRecommendation,
} from "../../../services/maritime/recommendationService";
import dayjs from "dayjs";

interface InsightsOverviewProps {
  vessels: Vessel[];
  requests: MovementRequest[];
  processingRecId: string | null;
  recommendationData: RecommendationSummary | null;
  onAcceptRecommendation: (rec: VoyageRecommendation) => void;
  onRejectRecommendation: (rec: VoyageRecommendation) => void;
}

export function InsightsOverview({
  requests,
  processingRecId,
  recommendationData,
  onAcceptRecommendation,
  onRejectRecommendation,
}: InsightsOverviewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!recommendationData) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "200px",
          color: "var(--muted)",
          textAlign: "center",
          p: 2,
        }}
      >
        <Typography variant="body2">
          No insights available. Click "Optimise Plan" to analyze.
        </Typography>
      </Box>
    );
  }

  const { recommendations, urgentUnscheduled } = recommendationData;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Grid container spacing={0.75} sx={{ mb: 1 }}>
          <Grid size={{ xs: 6 }}>
            <Box
              className="queue-item-card"
              sx={{ p: 0.75, cursor: "default" }}
            >
              <span className="chip-label" style={{ fontSize: 10 }}>
                Optimization Score
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {Math.round(recommendationData.overallScore * 100)}%
              </span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>
                {recommendations.length} Pending Actions
              </span>
            </Box>
          </Grid>
          <Grid size={{ xs: 6 }}>
            <Box
              className="queue-item-card"
              sx={{ p: 0.75, cursor: "default" }}
            >
              <span className="chip-label" style={{ fontSize: 10 }}>
                Unscheduled Critical
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color:
                    urgentUnscheduled.length > 0
                      ? "var(--danger)"
                      : "var(--text)",
                }}
              >
                {urgentUnscheduled.length}
              </span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>
                Requires Attention
              </span>
            </Box>
          </Grid>
        </Grid>

        <Typography sx={{ fontSize: 11, color: "var(--muted)", mb: 0.5 }}>
          AI Recommendations & Actions
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          minHeight: 0,
          pr: 0.5, // Add slight padding for scrollbar
        }}
      >
        {/* Urgent Unscheduled Alerts */}
        {urgentUnscheduled.map((req) => (
          <Box
            key={req.requestId}
            className="queue-item-card"
            sx={{
              cursor: "default",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              borderLeft: "3px solid var(--danger)",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AlertTriangle size={12} color="var(--danger)" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--danger)",
                  }}
                >
                  Unscheduled {req.urgency} Request
                </span>
              </Box>
              <span style={{ fontSize: 10 }}>
                {req.requestId}: {req.originName || req.originId} →{" "}
                {req.destinationName || req.destinationId}
              </span>
              <span style={{ fontSize: 10, color: "var(--muted)" }}>
                Due: {dayjs(req.earliestDeparture).format("DD MMM")} - No vessel
                available
              </span>
            </Box>
          </Box>
        ))}

        {/* Voyage Recommendations */}
        {recommendations.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const affectedRequests = requests.filter((r) =>
            rec.requestIds.includes(r.requestId),
          );

          return (
            <Box
              key={rec.id}
              className="queue-item-card"
              sx={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                borderLeft: "3px solid var(--accent)",
                transition: "all 0.2s ease",
                "&:hover": {
                  boxShadow: "0 4px 6px -1px var(--border)",
                },
              }}
              onClick={() => setExpandedId(isExpanded ? null : rec.id)}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>
                      {rec.type === "AddToVoyage"
                        ? "Add to Voyage"
                        : "New Voyage"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={10} color="var(--muted)" />
                    ) : (
                      <ChevronDown size={10} color="var(--muted)" />
                    )}
                  </Box>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    {rec.reason}
                  </span>
                </Box>
                <Box
                  sx={{ display: "flex", gap: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tooltip title="Reject Recommendation" arrow>
                    <Button
                      size="small"
                      disabled={!!processingRecId}
                      onClick={() => onRejectRecommendation(rec)}
                      sx={{
                        minWidth: 28,
                        height: 28,
                        p: 0,
                        color: "var(--muted)",
                      }}
                    >
                      <X size={14} />
                    </Button>
                  </Tooltip>
                  <Tooltip title="Accept Recommendation" arrow>
                    <Button
                      size="small"
                      disabled={!!processingRecId}
                      onClick={() => onAcceptRecommendation(rec)}
                      sx={{
                        minWidth: 28,
                        height: 28,
                        p: 0,
                        color: "var(--accent)",
                        bgcolor: "var(--accent-soft)",
                        "&:hover": {
                          bgcolor: "var(--accent-soft)",
                          opacity: 0.8,
                        },
                      }}
                    >
                      {processingRecId === rec.id ? (
                        <CircularProgress
                          size={14}
                          sx={{ color: "var(--accent)" }}
                        />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                    </Button>
                  </Tooltip>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 1,
                  bgcolor: "var(--bg)",
                  p: 1,
                  borderRadius: 1,
                  border: "1px solid var(--border)",
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    Vessel
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>
                    {rec.vesselName}
                  </span>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    Route
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rec.origin} → {rec.destination}
                  </span>
                </Box>
              </Box>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 0.5,
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent collapse when clicking details
                >
                  <Divider sx={{ mb: 0.5 }} />
                  {affectedRequests.map((req) => (
                    <Box key={req.requestId} sx={{ mb: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <Hash size={10} color="var(--accent)" />
                        <Typography
                          sx={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "var(--accent)",
                          }}
                        >
                          {req.requestId}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.25,
                          pl: 1.5,
                          borderLeft: "1px dashed var(--border)",
                        }}
                      >
                        {req.items.map((item) => (
                          <Box
                            key={item.itemId}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                overflow: "hidden",
                              }}
                            >
                              <Package size={10} color="var(--muted)" />
                              <Typography
                                noWrap
                                sx={{
                                  fontSize: 10,
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {item.itemTypeName || item.description}
                              </Typography>
                            </Box>
                            <Typography
                              sx={{
                                fontSize: 9,
                                color: "var(--muted)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {item.weight}kg
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box sx={{ display: "flex", gap: 1.25, alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Package size={10} color="var(--muted)" />
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {rec.itemCount} items
                    </span>
                  </Box>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      opacity: 0.3,
                    }}
                  >
                    •
                  </span>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Weight size={10} color="var(--muted)" />
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {Math.round(rec.totalWeight || 0).toLocaleString()} kg
                    </span>
                  </Box>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--muted)",
                      opacity: 0.3,
                    }}
                  >
                    •
                  </span>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Square size={10} color="var(--muted)" />
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>
                      {Math.round(rec.totalDeckArea || 0).toLocaleString()} m²
                    </span>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}

        {recommendations.length === 0 && urgentUnscheduled.length === 0 && (
          <Box
            className="queue-item-card"
            sx={{ p: 2, textAlign: "center", color: "var(--muted)" }}
          >
            <span style={{ fontSize: 11 }}>No pending optimizations</span>
          </Box>
        )}
      </Box>
    </Box>
  );
}
