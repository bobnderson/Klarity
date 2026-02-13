import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { InsightsOverview } from "./insights/InsightsOverview";
import { InsightsVessel } from "./insights/InsightsVessel";
import { InsightsCargo } from "./insights/InsightsCargo";
import type { Vessel } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";
import type { RecommendationSummary } from "../../services/maritime/recommendationService";

interface InsightsActionsProps {
  vessels: Vessel[];
  requests: MovementRequest[];
  isAnalyzing: boolean;
  processingRecId: string | null;
  recommendationData: RecommendationSummary | null;
  onAcceptRecommendation: (rec: any) => void;
  onRejectRecommendation: (rec: any) => void;
}

export function InsightsActions({
  vessels,
  requests,
  isAnalyzing,
  processingRecId,
  recommendationData,
  onAcceptRecommendation,
  onRejectRecommendation,
}: InsightsActionsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "vessel" | "cargo">(
    "overview",
  );

  return (
    <aside className="panel-container">
      <Box className="panel-header-custom">
        <Box className="panel-title-custom">
          <span className="panel-title-dot"></span>
          <span>Insights & Recommendations</span>
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          p: 1.5,
          minHeight: 0,
        }}
      >
        <Box
          sx={{ display: "flex", gap: 0.5, mb: 1, fontSize: 11, flexShrink: 0 }}
        >
          <Box
            onClick={() => setActiveTab("overview")}
            className="select-box"
            sx={{
              flex: 1,
              justifyContent: "center",
              cursor: "pointer",
              ...(activeTab === "overview"
                ? {
                    bgcolor: "var(--accent-soft)",
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                  }
                : {}),
            }}
          >
            Overview
          </Box>
          <Box
            onClick={() => setActiveTab("vessel")}
            className="select-box"
            sx={{
              flex: 1,
              justifyContent: "center",
              cursor: "pointer",
              ...(activeTab === "vessel"
                ? {
                    bgcolor: "var(--accent-soft)",
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                  }
                : {}),
            }}
          >
            Vessel
          </Box>
          <Box
            onClick={() => setActiveTab("cargo")}
            className="select-box"
            sx={{
              flex: 1,
              justifyContent: "center",
              cursor: "pointer",
              ...(activeTab === "cargo"
                ? {
                    bgcolor: "var(--accent-soft)",
                    borderColor: "var(--accent)",
                    color: "var(--accent)",
                  }
                : {}),
            }}
          >
            Cargo
          </Box>
        </Box>

        {isAnalyzing ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              gap: 2,
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            <CircularProgress size={24} sx={{ color: "var(--accent)" }} />
            <Typography variant="caption">
              Insights & Recommendations will be available soon...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {activeTab === "overview" && (
              <InsightsOverview
                vessels={vessels}
                requests={requests}
                processingRecId={processingRecId}
                recommendationData={recommendationData}
                onAcceptRecommendation={onAcceptRecommendation}
                onRejectRecommendation={onRejectRecommendation}
              />
            )}
            {activeTab === "vessel" && (
              <Box sx={{ overflowY: "auto", flex: 1 }}>
                <InsightsVessel />
              </Box>
            )}
            {activeTab === "cargo" && (
              <Box sx={{ overflowY: "auto", flex: 1 }}>
                <InsightsCargo />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </aside>
  );
}
