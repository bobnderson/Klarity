import { useState, useMemo } from "react";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { LayoutList, GanttChartSquare, Lightbulb, Plus } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { VesselTrack } from "./VesselTrack";
import { VoyageTimelineGantt } from "./VoyageTimelineGantt";
import { VoyageManifestDialog } from "./VoyageManifestDialog";
import { VoyageFormDialog } from "./VoyageFormDialog";
import type { UnifiedVessel, UnifiedVoyage } from "../../types/maritime/marine";

interface VoyageTimelineProps {
  vessels: UnifiedVessel[];
  activeCargoTypes: {
    type: string;
    label: string | undefined;
    color: string | undefined;
  }[];
  selectedVoyageId?: string;
  onSelectVoyage: (vesselId: string, voyageId: string) => void;
  onDropRequest?: (
    requestId: string,
    voyageId: string,
    vesselId: string,
  ) => void;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  isLoading: boolean;
  isInsightsCollapsed?: boolean;
  onToggleInsights?: () => void;
  onVoyageUpdated?: () => void;
}

export function VoyageTimeline({
  vessels,
  activeCargoTypes,
  selectedVoyageId,
  onSelectVoyage,
  onDropRequest,
  startDate,
  endDate,
  isLoading,
  isInsightsCollapsed = false,
  onToggleInsights,
  onVoyageUpdated,
}: VoyageTimelineProps) {
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [isVoyageFormOpen, setIsVoyageFormOpen] = useState(false);
  const [selectedManifestVoyage, setSelectedManifestVoyage] = useState<
    UnifiedVoyage | undefined
  >();
  const [selectedManifestVessel, setSelectedManifestVessel] = useState<
    UnifiedVessel | undefined
  >();
  const [editingVoyage, setEditingVoyage] = useState<
    UnifiedVoyage | undefined
  >();

  const handleOpenManifest = (voyage: UnifiedVoyage, vessel: UnifiedVessel) => {
    setSelectedManifestVoyage(voyage);
    setSelectedManifestVessel(vessel);
    setIsManifestOpen(true);
  };

  const handleEditVoyage = (voyage: UnifiedVoyage) => {
    setEditingVoyage(voyage);
    setIsVoyageFormOpen(true);
  };

  const avgDeckUtil = useMemo(() => {
    if (!startDate || !endDate) return 0;

    let totalUtil = 0;
    let count = 0;

    vessels.forEach((vessel) => {
      vessel.voyages.forEach((voyage) => {
        const dep = dayjs(voyage.departureDateTime);
        const isCancelled =
          voyage.statusId === "cancelled" ||
          voyage.statusName?.toLowerCase() === "cancelled";

        if (
          !isCancelled &&
          (dep.isAfter(startDate) || dep.isSame(startDate)) &&
          (dep.isBefore(endDate) || dep.isSame(endDate))
        ) {
          // Use deckUtil or payloadUtil/cabinUtil depending on what's available
          const util =
            (voyage as any).deckUtil ?? (voyage as any).payloadUtil ?? 0;
          totalUtil += util;
          count++;
        }
      });
    });

    return count > 0 ? totalUtil / count : 0;
  }, [vessels, startDate, endDate]);

  const dateRangeLabel =
    startDate && endDate
      ? `${startDate.format("DD MMM  YYYY")} → ${endDate.format("DD MMM YYYY")}`
      : "No Horizon Selected";

  return (
    <Box component="section" className="panel-container" sx={{ minWidth: 0 }}>
      {/* HEADER */}
      <Box className="panel-header-custom">
        <Box className="panel-title-custom">
          <span className="panel-title-dot"></span>
          <span>Timeline</span>
        </Box>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {activeCargoTypes.map((cargo) => (
              <Box
                key={cargo.type}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: 11,
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    bgcolor: cargo.color,
                  }}
                ></Box>{" "}
                {cargo.label}
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              borderLeft: "1px solid var(--border)",
              pl: 2,
            }}
          >
            <Tooltip title="List View" arrow>
              <IconButton
                size="small"
                onClick={() => setViewMode("list")}
                sx={{
                  color: viewMode === "list" ? "var(--accent)" : "var(--muted)",
                  bgcolor:
                    viewMode === "list" ? "var(--accent-soft)" : "transparent",
                }}
              >
                <LayoutList size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Gantt View" arrow>
              <IconButton
                size="small"
                onClick={() => setViewMode("gantt")}
                sx={{
                  color:
                    viewMode === "gantt" ? "var(--accent)" : "var(--muted)",
                  bgcolor:
                    viewMode === "gantt" ? "var(--accent-soft)" : "transparent",
                }}
              >
                <GanttChartSquare size={18} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Create Entry" arrow>
              <IconButton
                size="small"
                onClick={() => setIsVoyageFormOpen(true)}
                sx={{
                  ml: 1,
                  color: "var(--accent)",
                  bgcolor: "var(--accent-soft)",
                  "&:hover": { bgcolor: "var(--accent-soft)", opacity: 0.8 },
                }}
              >
                <Plus size={18} />
              </IconButton>
            </Tooltip>

            {onToggleInsights && (
              <Tooltip title="Insights" arrow>
                <IconButton
                  size="small"
                  onClick={onToggleInsights}
                  sx={{
                    ml: 1,
                    color: isInsightsCollapsed
                      ? "var(--muted)"
                      : "var(--accent)",
                    bgcolor: isInsightsCollapsed
                      ? "transparent"
                      : "var(--accent-soft)",
                    "&:hover": { color: "var(--accent)" },
                  }}
                >
                  <Lightbulb size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          mb: 1.5,
          fontSize: 11,
          color: "var(--muted)",
          borderBottom: "1px solid var(--border)",
          pb: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{dateRangeLabel}</span>
        {avgDeckUtil > 0 && (
          <Tooltip title="Average Utilization for selected horizon">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>
                Avg Util:
              </span>
              <span
                style={{
                  color:
                    avgDeckUtil > 85
                      ? "var(--danger)"
                      : avgDeckUtil > 50
                        ? "var(--success)"
                        : "var(--warning)",
                  fontWeight: 700,
                }}
              >
                {avgDeckUtil.toFixed(1)}%
              </span>
            </Box>
          </Tooltip>
        )}
      </Box>
      <Box
        className={`panel-body-scroll ${viewMode === "list" ? "voyage-timeline-scroll-area" : ""}`}
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: viewMode === "list" ? "auto" : "hidden",
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
              minHeight: 200,
            }}
          >
            <CircularProgress size={32} thickness={4} />
          </Box>
        ) : viewMode === "list" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {vessels.map((vessel, vIdx) => (
              <VesselTrack
                key={
                  (vessel as any).vesselId ||
                  (vessel as any).helicopterId ||
                  vIdx
                }
                vessel={vessel}
                selectedVoyageId={selectedVoyageId}
                onSelectVoyage={onSelectVoyage}
                onDropRequest={onDropRequest}
                onOpenManifest={handleOpenManifest}
                onEditVoyage={handleEditVoyage}
                isInsightsCollapsed={isInsightsCollapsed}
                onVoyageUpdated={onVoyageUpdated}
              />
            ))}
          </Box>
        ) : (
          <VoyageTimelineGantt
            vessels={vessels as any}
            startDate={startDate}
            endDate={endDate}
            onSelectVoyage={onSelectVoyage}
            selectedVoyageId={selectedVoyageId}
          />
        )}
      </Box>

      <VoyageManifestDialog
        open={isManifestOpen}
        voyage={selectedManifestVoyage as any}
        vessel={selectedManifestVessel as any}
        onClose={() => setIsManifestOpen(false)}
        onUpdate={onVoyageUpdated}
      />

      <VoyageFormDialog
        open={isVoyageFormOpen}
        initialData={editingVoyage as any}
        onClose={() => {
          setIsVoyageFormOpen(false);
          setEditingVoyage(undefined);
        }}
        onSuccess={() => {
          setIsVoyageFormOpen(false);
          setEditingVoyage(undefined);
          if (onVoyageUpdated) onVoyageUpdated();
        }}
      />
    </Box>
  );
}
