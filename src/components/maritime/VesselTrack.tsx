import dayjs from "dayjs";
import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  Ship,
  FileText,
  Edit2,
  Circle,
  CheckCircle2,
  Trash2,
  Plane,
} from "lucide-react";
import { CARGO_TYPE_CONFIG } from "../../types/maritime/marine";
import type { UnifiedVessel, UnifiedVoyage } from "../../types/maritime/marine";
import { getVoyageStatusStyle } from "../../utils/statusUtils";
import { formatNumber } from "../../utils/formatters";
import {
  updateVoyage,
  deleteVoyage,
} from "../../services/maritime/voyageService";
import {
  updateFlight,
  deleteFlight,
} from "../../services/maritime/flightService";
import { toast } from "react-toastify";

interface VesselTrackProps {
  vessel: UnifiedVessel;
  selectedVoyageId?: string;
  onSelectVoyage: (vesselId: string, voyageId: string) => void;
  onOpenManifest: (voyage: UnifiedVoyage, vessel: UnifiedVessel) => void;
  onEditVoyage?: (voyage: UnifiedVoyage, vessel: UnifiedVessel) => void;
  onDropRequest?: (
    requestId: string,
    voyageId: string,
    vesselId: string,
  ) => void;
  isInsightsCollapsed?: boolean;
  onVoyageUpdated?: () => void;
}

export function VesselTrack({
  vessel,
  selectedVoyageId,
  onSelectVoyage,
  onOpenManifest,
  onEditVoyage,
  onDropRequest,
  isInsightsCollapsed = false,
  onVoyageUpdated,
}: VesselTrackProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "cancel" | "delete" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [activeVoyageForStatus, setActiveVoyageForStatus] = useState<
    UnifiedVoyage | undefined
  >(undefined);

  const isAviation = (vessel as any).helicopterId !== undefined;
  const vesselId = (vessel as any).vesselId || (vessel as any).helicopterId;
  const vesselName =
    (vessel as any).vesselName || (vessel as any).helicopterName;

  const handleStatusClick = (
    event: React.MouseEvent<HTMLElement>,
    voyage: UnifiedVoyage,
  ) => {
    event.stopPropagation();
    setActiveVoyageForStatus(voyage);
    setStatusMenuAnchor(event.currentTarget);
  };

  const handleStatusClose = () => {
    setStatusMenuAnchor(null);
    setActiveVoyageForStatus(undefined);
    setPendingStatusId(null);
  };

  const initiateStatusChange = (newStatusId: string) => {
    if (!activeVoyageForStatus) return;

    if (newStatusId === "cancelled") {
      setConfirmAction("cancel");
      setPendingStatusId(newStatusId);
      setConfirmDialogOpen(true);
      setStatusMenuAnchor(null);
    } else {
      executeStatusUpdate(newStatusId);
    }
  };

  const initiateDelete = () => {
    if (!activeVoyageForStatus) return;
    setConfirmAction("delete");
    setConfirmDialogOpen(true);
    setStatusMenuAnchor(null);
  };

  const executeStatusUpdate = async (statusId: string) => {
    if (!activeVoyageForStatus) return;

    setIsLoading(true);
    try {
      const updated = { ...activeVoyageForStatus, statusId: statusId };
      if (isAviation) {
        await updateFlight(updated as any);
      } else {
        await updateVoyage(updated as any);
      }
      toast.success(`Status updated to ${statusId}`);
      onVoyageUpdated?.();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsLoading(false);
      handleStatusClose();
      setConfirmDialogOpen(false);
    }
  };

  const executeDelete = async () => {
    if (!activeVoyageForStatus) return;

    setIsLoading(true);
    try {
      const vid =
        (activeVoyageForStatus as any).voyageId ||
        (activeVoyageForStatus as any).flightId;
      if (isAviation) {
        await deleteFlight(vid);
      } else {
        await deleteVoyage(vid);
      }
      toast.success("Deleted successfully");
      onVoyageUpdated?.();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete");
    } finally {
      setIsLoading(false);
      handleStatusClose();
      setConfirmDialogOpen(false);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === "cancel" && pendingStatusId) {
      executeStatusUpdate(pendingStatusId);
    } else if (confirmAction === "delete") {
      executeDelete();
    }
  };

  const availableStatuses = [
    { id: "scheduled", label: "Scheduled", color: "var(--info)" },
    { id: "enroute", label: "En Route", color: "var(--success)" },
    { id: "arrived", label: "Arrived", color: "var(--success)" },
    { id: "completed", label: "Completed", color: "var(--muted)" },
    { id: "delayed", label: "Delayed", color: "var(--error)" },
    { id: "cancelled", label: "Cancelled", color: "var(--error)" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box
        sx={{
          fontSize: 11,
          color: "var(--muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "var(--accent-soft)",
            color: "var(--accent)",
            px: 1.5,
            py: 0.5,
            borderRadius: "999px",
            border: "1px solid var(--accent)",
          }}
        >
          {isAviation ? <Plane size={14} /> : <Ship size={14} />}
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "var(--accent)",
            }}
          >
            {vesselName}
          </Typography>
        </Box>
      </Box>
      <Box
        className="voyage-track-container"
        sx={{
          display: "grid",
          gridTemplateColumns: isInsightsCollapsed
            ? "repeat(3, 1fr)"
            : "repeat(2, 1fr)",
          gap: 1,
        }}
      >
        {vessel.voyages.map((v, voyIdx) => {
          const voyage = v as any;
          const vid = voyage.voyageId || voyage.flightId;
          const isSelected = vid === selectedVoyageId;
          const arrivalTime = voyage.eta || voyage.arrivalDateTime;
          const weightUtil = voyage.weightUtil ?? voyage.payloadUtil ?? 0;
          const deckUtil = voyage.deckUtil ?? voyage.cabinUtil ?? 0;

          return (
            <Box
              key={vid || voyIdx}
              className="voyage-card-box"
              onClick={() => onSelectVoyage(vesselId || "", vid)}
              sx={{
                cursor: "pointer",
                transition: "all 0.2s ease",
                ...(isSelected
                  ? {
                      borderColor: "var(--accent)",
                      bgcolor: "var(--accent-soft)",
                      boxShadow: "0 0 0 1px var(--accent)",
                    }
                  : {
                      "&:hover": {
                        borderColor: "var(--accent-muted)",
                        bgcolor: "rgba(255,255,255,0.02)",
                      },
                    }),
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (
                  voyage.statusId === "cancelled" ||
                  voyage.statusName === "cancelled" ||
                  voyage.statusId === "completed" ||
                  voyage.statusName === "completed"
                ) {
                  e.dataTransfer.dropEffect = "move";
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(var(--danger-rgb), 0.1)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "var(--danger)";
                  return;
                }
                e.dataTransfer.dropEffect = "move";
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  "rgba(var(--accent-rgb), 0.1)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--accent)";
              }}
              onDragLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                (e.currentTarget as HTMLElement).style.borderColor = "";
              }}
              onDrop={(e) => {
                e.preventDefault();
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
                (e.currentTarget as HTMLElement).style.borderColor = "";

                if (
                  voyage.statusId === "cancelled" ||
                  voyage.statusName === "cancelled" ||
                  voyage.statusId === "completed" ||
                  voyage.statusName === "completed"
                ) {
                  toast.error(`Cannot add requests to a finished entry`);
                  return;
                }

                const requestId = e.dataTransfer.getData("requestId");
                if (requestId && onDropRequest) {
                  onDropRequest(requestId, vid, vesselId || "");
                }
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  {voyage.originName || voyage.originId || voyage.origin} →{" "}
                  {voyage.destinationName ||
                    voyage.destinationId ||
                    voyage.destination}
                </span>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: 9,
                    color: "var(--muted)",
                  }}
                >
                  <span>
                    Dep {dayjs(voyage.departureDateTime).format("DD MMM HH:mm")}
                  </span>
                  <span>|</span>
                  <span>Arr {dayjs(arrivalTime).format("DD MMM HH:mm")}</span>
                </Box>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 0.75,
                  fontSize: 10,
                  color: "var(--muted)",
                }}
              >
                <span>Weight {formatNumber(weightUtil, 1)}%</span>
                <span>Space {formatNumber(deckUtil, 1)}%</span>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  gap: 0.5,
                  fontSize: 10,
                  color: "var(--muted)",
                  alignItems: "center",
                }}
              >
                <span>Util</span>
                <Box className="voyage-util-bar-box">
                  <Box
                    className="voyage-util-fill-box"
                    sx={{ width: `${deckUtil}%` }}
                  ></Box>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.35, mt: 0.5 }}>
                {voyage.cargoDistribution?.map((cargo: any, cIdx: number) => (
                  <Box
                    key={cIdx}
                    className="cargo-block-unit"
                    sx={{
                      bgcolor:
                        CARGO_TYPE_CONFIG[cargo.type]?.color || "var(--muted)",
                      width: `${cargo.value}%`,
                    }}
                  ></Box>
                ))}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  mt: "auto",
                  pt: 1,
                }}
              >
                <Box
                  sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", flex: 1 }}
                >
                  {(() => {
                    const statusLabel =
                      voyage.statusName || voyage.statusId || "Scheduled";
                    const style = getVoyageStatusStyle(statusLabel);
                    const colorMap = {
                      success: "var(--success)",
                      error: "var(--danger)",
                      warning: "var(--warning)",
                      info: "var(--success)",
                      default: "var(--muted)",
                    };
                    const vColor =
                      (colorMap as any)[style.color] || "var(--muted)";

                    return (
                      <span
                        className="queue-tag"
                        onClick={(e) => handleStatusClick(e, voyage)}
                        style={{
                          fontSize: 9,
                          borderColor: vColor,
                          color: vColor,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        {style.label}
                        <Edit2 size={8} style={{ opacity: 0.5 }} />
                      </span>
                    );
                  })()}
                  {voyage.tags?.map((tag: any, tIdx: number) => (
                    <span
                      key={tIdx}
                      className="queue-tag"
                      style={{ fontSize: 9 }}
                    >
                      {tag}
                    </span>
                  ))}
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <Tooltip title="View Manifest" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenManifest(voyage, vessel);
                      }}
                      sx={{
                        p: 0.25,
                        color: "var(--muted)",
                        "&:hover": { color: "var(--accent)" },
                      }}
                    >
                      <FileText size={14} />
                    </IconButton>
                  </Tooltip>
                  {onEditVoyage && (
                    <Tooltip title="Edit" arrow>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditVoyage(voyage, vessel);
                        }}
                        sx={{
                          p: 0.25,
                          color: "var(--muted)",
                          "&:hover": { color: "var(--accent)" },
                        }}
                      >
                        <Edit2 size={14} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusClose}
        PaperProps={{
          sx: {
            mt: 0.5,
            bgcolor: "var(--panel)",
            border: "1px solid var(--border)",
            minWidth: 120,
            "& .MuiList-root": { p: 0.5 },
          },
        }}
      >
        {availableStatuses.map((status) => (
          <MenuItem
            key={status.id}
            onClick={() => initiateStatusChange(status.id)}
            dense
            sx={{
              fontSize: 10,
              gap: 1,
              minHeight: 24,
              px: 1,
              py: 0.5,
              borderRadius: "4px",
              "&:hover": { bgcolor: "var(--accent-soft)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 16 }}>
              {(activeVoyageForStatus as any)?.statusName === status.id ||
              (activeVoyageForStatus as any)?.statusId === status.id ? (
                <CheckCircle2
                  size={10}
                  color={status.color.replace("var(--error)", "var(--danger)")}
                />
              ) : (
                <Circle
                  size={10}
                  color={status.color.replace("var(--error)", "var(--danger)")}
                />
              )}
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ style: { fontSize: 10 } }}>
              {status.label}
            </ListItemText>
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5, borderColor: "var(--border)" }} />
        <MenuItem
          onClick={initiateDelete}
          dense
          sx={{
            fontSize: 10,
            gap: 1,
            minHeight: 24,
            px: 1,
            py: 0.5,
            borderRadius: "4px",
            color: "var(--danger)",
            "&:hover": { bgcolor: "var(--danger)", color: "white" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 16 }}>
            <Trash2 size={10} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ style: { fontSize: 10 } }}>
            Delete {isAviation ? "Flight" : "Voyage"}
          </ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        open={confirmDialogOpen}
        onClose={() => !isLoading && setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: "var(--panel)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ color: "var(--text)" }}>
          {confirmAction === "delete" ? "Delete " : "Cancel "}
          {isAviation ? "Flight" : "Voyage"}
        </DialogTitle>
        <DialogContent sx={{ color: "var(--muted)" }}>
          <Typography variant="body2">
            {confirmAction === "delete"
              ? `Are you sure you want to delete this ${isAviation ? "flight" : "voyage"}? This action will remove it and unassign all items.`
              : `Are you sure you want to cancel? All assigned items will be unassigned.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            disabled={isLoading}
            sx={{ color: "var(--muted)" }}
          >
            Go Back
          </Button>
          <Button
            onClick={handleConfirmAction}
            disabled={isLoading}
            variant="contained"
            color="error"
            startIcon={
              isLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isLoading
              ? "Processing..."
              : confirmAction === "delete"
                ? "Delete"
                : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
