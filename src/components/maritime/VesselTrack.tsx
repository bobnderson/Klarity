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
  MapPin,
  Circle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { CARGO_TYPE_CONFIG } from "../../types/maritime/marine";
import type { Vessel, Voyage } from "../../types/maritime/marine";
import { getVoyageStatusStyle } from "../../utils/statusUtils";
import { formatNumber } from "../../utils/formatters";
import {
  updateVoyage,
  deleteVoyage,
} from "../../services/maritime/voyageService";
import { toast } from "react-toastify";

interface VesselTrackProps {
  vessel: Vessel;
  selectedVoyageId?: string;
  onSelectVoyage: (vesselId: string, voyageId: string) => void;
  onOpenManifest: (voyage: Voyage, vessel: Vessel) => void;
  onEditVoyage?: (voyage: Voyage, vessel: Vessel) => void;
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
    Voyage | undefined
  >(undefined);

  const handleStatusClick = (
    event: React.MouseEvent<HTMLElement>,
    voyage: Voyage,
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
      setStatusMenuAnchor(null); // Close menu
    } else {
      // Direct update for non-destructive actions
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
      const updatedVoyage = { ...activeVoyageForStatus, statusId: statusId };
      await updateVoyage(updatedVoyage);
      toast.success(`Voyage status updated to ${statusId}`);
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
      await deleteVoyage(activeVoyageForStatus.voyageId);
      toast.success("Voyage deleted successfully");
      onVoyageUpdated?.();
    } catch (error) {
      console.error("Failed to delete voyage:", error);
      toast.error("Failed to delete voyage");
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
      {/* ... previous render code ... */}
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
            borderOpacity: 0.2,
          }}
        >
          <Ship size={14} />
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.02em",
              color: "var(--accent)",
            }}
          >
            {vessel.vesselName}
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
        {vessel.voyages.map((voyage, voyIdx) => {
          const isSelected = voyage.voyageId === selectedVoyageId;
          return (
            <Box
              key={voyage.voyageId || voyIdx}
              className="voyage-card-box"
              onClick={() =>
                onSelectVoyage(vessel.vesselId || "", voyage.voyageId)
              }
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
                // Check if voyage is cancelled or completed
                if (
                  voyage.statusId === "cancelled" ||
                  voyage.statusName === "cancelled" ||
                  voyage.statusId === "completed" ||
                  voyage.statusName === "completed"
                ) {
                  // Must allow drop for onDrop to fire and show toast
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

                // Prevent drop if voyage is cancelled or completed
                if (
                  voyage.statusId === "cancelled" ||
                  voyage.statusName === "cancelled" ||
                  voyage.statusId === "completed" ||
                  voyage.statusName === "completed"
                ) {
                  const status =
                    voyage.statusName || voyage.statusId || "completed";
                  toast.error(
                    `Cannot add requests to a ${status.toLowerCase()} voyage`,
                  );
                  return;
                }

                const requestId = e.dataTransfer.getData("requestId");
                if (requestId && onDropRequest) {
                  onDropRequest(
                    requestId,
                    voyage.voyageId,
                    vessel.vesselId || "",
                  );
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
                  {voyage.originName ||
                    voyage.originId ||
                    (voyage as any).origin}{" "}
                  →{" "}
                  {voyage.destinationName ||
                    voyage.destinationId ||
                    (voyage as any).destination}
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
                  <span>ETA {dayjs(voyage.eta).format("DD MMM HH:mm")}</span>
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
                <span>Weight {formatNumber(voyage.weightUtil, 1)}%</span>
                <span>Deck {formatNumber(voyage.deckUtil, 1)}%</span>
                <span>Cabin {formatNumber(voyage.cabinUtil, 1)}%</span>
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
                <span>Deck</span>
                <Box className="voyage-util-bar-box">
                  <Box
                    className="voyage-util-fill-box"
                    sx={{ width: `${voyage.deckUtil}%` }}
                  ></Box>
                </Box>
              </Box>
              <Box sx={{ display: "flex", gap: 0.35, mt: 0.5 }}>
                {voyage.cargoDistribution.map((cargo, cIdx) => (
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
                      info: "var(--success)", // Use success for En Route
                      default: "var(--muted)",
                    };
                    const vColor =
                      colorMap[style.color as keyof typeof colorMap] ||
                      "var(--muted)";

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
                  {voyage.tags?.map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="queue-tag"
                      style={{ fontSize: 9 }}
                    >
                      {tag}
                    </span>
                  ))}
                  {voyage.stops && voyage.stops.length > 0 && (
                    <Tooltip
                      title={`${voyage.stops.length} Stop${voyage.stops.length > 1 ? "s" : ""}: ${voyage.stops.map((s) => s.locationId).join(", ")}`}
                      arrow
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          bgcolor: "rgba(255,255,255,0.05)",
                          px: 0.5,
                          py: 0,
                          borderRadius: 0.5,
                          border: "1px solid var(--border)",
                          color: "var(--accent)",
                        }}
                      >
                        <MapPin size={10} />
                        <span style={{ fontSize: 9 }}>
                          {voyage.stops.length}
                        </span>
                      </Box>
                    </Tooltip>
                  )}
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
                    <Tooltip title="Edit Voyage" arrow>
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
            "& .MuiList-root": {
              p: 0.5,
            },
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
              {activeVoyageForStatus?.statusName === status.id ||
              activeVoyageForStatus?.statusId === status.id ? (
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
            Delete Voyage
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
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
        <DialogTitle sx={{ bgcolor: "var(--panel)", color: "var(--text)" }}>
          {confirmAction === "delete" ? "Delete Voyage" : "Cancel Voyage"}
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "var(--panel)", color: "var(--muted)" }}>
          <Typography variant="body2">
            {confirmAction === "delete"
              ? "Are you sure you want to delete this voyage? This action will remove the voyage and unassign all items. This cannot be undone."
              : "Are you sure you want to cancel this voyage? All assigned items will be unassigned and returned to the queue."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: "var(--panel)", p: 2 }}>
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
            color="error" // Use error color for both
            startIcon={
              isLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {isLoading
              ? "Processing..."
              : confirmAction === "delete"
                ? "Delete"
                : "Cancel Voyage"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
