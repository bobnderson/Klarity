import { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Collapse,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  X,
  FileText,
  Trash2,
  Plus,
  Download,
  Scale,
  Square,
  MapPin,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { UnifiedVoyage, UnifiedVessel } from "../../types/maritime/marine";
import type { MovementRequest } from "../../types/maritime/logistics";
import api from "../../services/api";
import { marineMovementService } from "../../services/maritime/marineMovementService";
import {
  getVoyageManifest,
  assignItemsToVoyage,
  unassignItemsFromVoyage,
} from "../../services/maritime/voyageService";
import {
  getFlightManifest,
  assignItemsToFlight,
  unassignItemsFromFlight,
} from "../../services/maritime/flightService";
import { toast } from "react-toastify";
import { formatNumber } from "../../utils/formatters";

interface VoyageManifestDialogProps {
  open: boolean;
  onClose: () => void;
  voyage: UnifiedVoyage | undefined;
  vessel: UnifiedVessel | undefined;
  onUpdate?: () => void;
}

export function VoyageManifestDialog({
  open,
  onClose,
  voyage,
  vessel,
  onUpdate,
}: VoyageManifestDialogProps) {
  const isAviation = (vessel as any)?.helicopterId !== undefined;
  const vid = (voyage as any)?.voyageId || (voyage as any)?.flightId;
  const vesselName =
    (vessel as any)?.vesselName || (vessel as any)?.helicopterName;
  const arrTime = (voyage as any)?.eta || (voyage as any)?.arrivalDateTime;
  const [assignedRequests, setAssignedRequests] = useState<MovementRequest[]>(
    [],
  );
  const [availableRequests, setAvailableRequests] = useState<MovementRequest[]>(
    [],
  );
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );
  const [processingItemId, setProcessingItemId] = useState<string | null>(null);
  const [isLoadingManifest, setIsLoadingManifest] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [expandedRequestIds, setExpandedRequestIds] = useState<Set<string>>(
    new Set(),
  );

  useEffect(() => {
    if (open && voyage) {
      loadManifestData();
    }
  }, [open, voyage]);

  const loadManifestData = async () => {
    if (!voyage || !vid) return;
    try {
      setIsLoadingManifest(true);
      const assigned = isAviation
        ? await getFlightManifest(vid)
        : await getVoyageManifest(vid);
      setAssignedRequests(assigned);
    } catch (error) {
      console.error("Failed to load manifest data:", error);
    } finally {
      setIsLoadingManifest(false);
    }
  };

  useEffect(() => {
    if (isAddingMode && voyage) {
      loadAvailableRequests();
      setExpandedRequestIds(new Set());
    }
  }, [isAddingMode, voyage]);

  const loadAvailableRequests = async () => {
    if (!voyage) return;
    try {
      const available = await marineMovementService.getPendingMovementRequests({
        originId: voyage.originId,
        destinationId: voyage.destinationId,
        mode: isAviation ? "Aviation" : "Marine",
      });
      setAvailableRequests(available);
    } catch (error) {
      console.error("Failed to load available requests:", error);
    }
  };

  const handleRemoveRequest = async (requestId: string) => {
    try {
      setProcessingRequestId(requestId);
      // Unassign all items in this request from the current voyage
      const request = assignedRequests.find((r) => r.requestId === requestId);
      if (request && voyage && vid) {
        const itemIds = request.items.map((i) => i.itemId);
        if (isAviation) {
          await unassignItemsFromFlight(vid, itemIds);
        } else {
          await unassignItemsFromVoyage(vid, itemIds);
        }
      }
      toast.info("Request removed from manifest");
      loadManifestData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to remove request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeleteItem = async (requestId: string, itemId: string) => {
    try {
      setProcessingItemId(itemId);
      const request = assignedRequests.find((r) => r.requestId === requestId);
      if (!request) return;

      if (voyage && vid) {
        if (isAviation) {
          await unassignItemsFromFlight(vid, [itemId]);
        } else {
          await unassignItemsFromVoyage(vid, [itemId]);
        }
      }
      toast.info("Item removed from manifest");
      loadManifestData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to remove item from manifest");
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleAddRequest = async (requestId: string) => {
    if (!voyage) return;
    try {
      setProcessingRequestId(requestId);
      const request = availableRequests.find((r) => r.requestId === requestId);
      if (request && vid) {
        // Assign ALL unassigned items to this voyage
        const itemIds = request.items
          .filter((i) => !i.assignedVoyageId)
          .map((i) => i.itemId);

        if (isAviation) {
          await assignItemsToFlight(vid, itemIds);
        } else {
          await assignItemsToVoyage(vid, itemIds);
        }
      }
      toast.success("Request added to manifest");
      setIsAddingMode(false);
      loadManifestData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to add request");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleAddItem = async (itemId: string) => {
    if (!voyage) return;
    try {
      setProcessingItemId(itemId);
      if (isAviation) {
        await assignItemsToFlight(vid || "", [itemId]);
      } else {
        await assignItemsToVoyage(vid || "", [itemId]);
      }
      toast.success("Item added to manifest");

      // Refresh data
      loadManifestData();
      if (isAddingMode) loadAvailableRequests();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to add item");
    } finally {
      setProcessingItemId(null);
    }
  };

  const toggleRequestExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedRequestIds);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequestIds(newExpanded);
  };

  const handleGeneratePDF = async () => {
    if (!voyage || !vessel || !vid) return;
    try {
      setIsDownloadingPdf(true);
      const endpoint = isAviation
        ? `flights/${vid}/manifest/download`
        : `voyages/${vid}/manifest/download`;

      const response = await api.get(endpoint, {
        responseType: "blob",
      });

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Manifest_${vesselName.replace(/\s+/g, "_")}_${vid.substring(0, 8)}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Manifest PDF downloaded successfully");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF manifest");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const manifestStats = useMemo(() => {
    let totalWeight = 0;
    let totalArea = 0;

    assignedRequests.forEach((req) => {
      req.items.forEach((item) => {
        totalWeight += item.weight || 0;
        totalArea += parseArea(
          item.dimensions,
          item.quantity,
          item.dimensionUnit,
        );
      });
    });

    return { totalWeight, totalArea };
  }, [assignedRequests]);

  if (!voyage) return null;

  const vesselCap = (vessel as any)?.capacities || {
    deadWeight: 0,
    deckArea: 0,
  };
  const remainingWeight = Math.max(
    0,
    (vesselCap.deadWeight || 0) - manifestStats.totalWeight,
  );
  const remainingArea = Math.max(
    0,
    (vesselCap.deckArea || 0) - manifestStats.totalArea,
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "var(--panel)",
          backgroundImage: "none",
          border: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FileText size={20} color="var(--accent)" />
          <Typography variant="h6">
            {isAviation ? "Flight Manifest" : "Voyage Manifest"}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              ml: 2,
              bgcolor: "var(--accent-soft)",
              color: "var(--accent)",
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {vid}
          </Typography>
        </Box>
        <Box>
          <Tooltip title="Generate PDF Manifest">
            <IconButton
              onClick={handleGeneratePDF}
              disabled={isDownloadingPdf}
              sx={{ mr: 1, color: "var(--text)" }}
            >
              {isDownloadingPdf ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Download size={18} />
              )}
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: "var(--muted)" }}
          >
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          p: 0,
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "var(--bg-soft)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <ManifestSummary
            isAviation={isAviation}
            vesselName={vesselName}
            voyage={voyage}
            arrTime={arrTime}
          />

          {voyage.stops && voyage.stops.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                color="var(--muted)"
                display="block"
                sx={{ mb: 0.5 }}
              >
                STOPS
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {voyage.stops.map((stop, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      bgcolor: "rgba(255,255,255,0.05)",
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <MapPin size={12} color="var(--accent)" />
                    <Typography variant="caption" fontWeight={600}>
                      {stop.locationId}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="var(--muted)"
                      sx={{ fontSize: 10, ml: 0.5 }}
                    >
                      ({dayjs(stop.arrivalDateTime).format("DD MMM HH:mm")})
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 1.5, opacity: 0.1 }} />

          <CapacitySection
            isAviation={isAviation}
            manifestStats={manifestStats}
            vesselCap={vesselCap}
            remainingWeight={remainingWeight}
            remainingArea={remainingArea}
            voyage={voyage}
          />
        </Box>

        <Box sx={{ p: 2 }}>
          {isAddingMode ? (
            <AvailableRequestsList
              availableRequests={availableRequests}
              setIsAddingMode={setIsAddingMode}
              toggleRequestExpansion={toggleRequestExpansion}
              expandedRequestIds={expandedRequestIds}
              processingRequestId={processingRequestId}
              handleAddRequest={handleAddRequest}
              processingItemId={processingItemId}
              handleAddItem={handleAddItem}
            />
          ) : (
            <AssignedRequestsList
              assignedRequests={assignedRequests}
              setIsAddingMode={setIsAddingMode}
              isLoadingManifest={isLoadingManifest}
              handleRemoveRequest={handleRemoveRequest}
              handleDeleteItem={handleDeleteItem}
              processingRequestId={processingRequestId}
              processingItemId={processingItemId}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ color: "var(--text)", borderColor: "var(--border)" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ManifestSummary({
  isAviation,
  vesselName,
  voyage,
  arrTime,
}: {
  isAviation: boolean;
  vesselName: string;
  voyage: UnifiedVoyage;
  arrTime: any;
}) {
  return (
    <Box sx={{ display: "flex", gap: 4, mb: 1.5, alignItems: "center" }}>
      <Box>
        <Typography variant="caption" color="var(--muted)" display="block">
          {isAviation ? "AIRCRAFT" : "VESSEL"}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {vesselName}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="var(--muted)" display="block">
          ROUTE
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {voyage.originName || voyage.originId} →{" "}
          {voyage.destinationName || voyage.destinationId}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="var(--muted)" display="block">
          DEPARTURE
        </Typography>
        <Typography variant="body2">
          {new Date(voyage.departureDateTime).toLocaleString()}
        </Typography>
      </Box>
      <Box>
        <Typography variant="caption" color="var(--muted)" display="block">
          {isAviation ? "ARRIVAL" : "EST. ARRIVAL"}
        </Typography>
        <Typography variant="body2">
          {new Date(arrTime).toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}

function CapacitySection({
  isAviation,
  manifestStats,
  vesselCap,
  remainingWeight,
  remainingArea,
  voyage,
}: {
  isAviation: boolean;
  manifestStats: any;
  vesselCap: any;
  remainingWeight: number;
  remainingArea: number;
  voyage: UnifiedVoyage;
}) {
  return (
    <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Scale size={16} color="var(--accent)" />
        <Box>
          <Typography variant="caption" color="var(--muted)" display="block">
            {isAviation ? "PAYLOAD (T)" : "DEADWEIGHT (T)"}
          </Typography>
          <Typography variant="body2">
            <span style={{ fontWeight: 700 }}>
              {formatNumber(manifestStats.totalWeight, 1)}
            </span>
            <span style={{ color: "var(--muted)", margin: "0 4px" }}>/</span>
            <span>{formatNumber(vesselCap.deadWeight)}</span>
            <Typography
              component="span"
              variant="caption"
              sx={{
                ml: 1,
                color: remainingWeight < 10 ? "error.main" : "success.main",
                fontWeight: 600,
              }}
            >
              ({formatNumber(remainingWeight, 1)} left)
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Square size={16} color="var(--accent)" />
        <Box>
          <Typography variant="caption" color="var(--muted)" display="block">
            DECK AREA (M²)
          </Typography>
          <Typography variant="body2">
            <span style={{ fontWeight: 700 }}>
              {formatNumber(manifestStats.totalArea, 1)}
            </span>
            <span style={{ color: "var(--muted)", margin: "0 4px" }}>/</span>
            <span>{formatNumber(vesselCap.deckArea)}</span>
            <Typography
              component="span"
              variant="caption"
              sx={{
                ml: 1,
                color: remainingArea < 20 ? "error.main" : "success.main",
                fontWeight: 600,
              }}
            >
              ({formatNumber(remainingArea, 1)} left)
            </Typography>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
        <Chip
          label={`Weight: ${formatNumber((voyage as any).weightUtil || (voyage as any).payloadUtil || 0, 1)}%`}
          size="small"
          color={
            ((voyage as any).weightUtil || (voyage as any).payloadUtil || 0) >
            85
              ? "error"
              : "primary"
          }
          sx={{ height: 20, fontSize: 10 }}
        />
        <Chip
          label={`${isAviation ? "Cabin" : "Deck"}: ${formatNumber((voyage as any).deckUtil || (voyage as any).cabinUtil || 0, 1)}%`}
          size="small"
          color={
            ((voyage as any).deckUtil || (voyage as any).cabinUtil || 0) > 85
              ? "error"
              : "primary"
          }
          sx={{ height: 20, fontSize: 10 }}
        />
      </Box>
    </Box>
  );
}

function Divider({ sx, ...props }: any) {
  return (
    <Box sx={{ height: "1px", bgcolor: "var(--border)", ...sx }} {...props} />
  );
}
function AvailableRequestsList({
  availableRequests,
  setIsAddingMode,
  toggleRequestExpansion,
  expandedRequestIds,
  processingRequestId,
  handleAddRequest,
  processingItemId,
  handleAddItem,
}: {
  availableRequests: MovementRequest[];
  setIsAddingMode: (val: boolean) => void;
  toggleRequestExpansion: (id: string) => void;
  expandedRequestIds: Set<string>;
  processingRequestId: string | null;
  handleAddRequest: (id: string) => void;
  processingItemId: string | null;
  handleAddItem: (id: string) => void;
}) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle2">Available Approved Requests</Typography>
        <Button size="small" onClick={() => setIsAddingMode(false)}>
          Cancel
        </Button>
      </Box>
      {availableRequests.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ textAlign: "center", py: 4, color: "var(--muted)" }}
        >
          No additional approved requests found for this route.
        </Typography>
      ) : (
        <List sx={{ pt: 0 }}>
          {availableRequests.map((req) => (
            <ListItem
              key={req.requestId}
              sx={{
                mb: 1,
                bgcolor: "rgba(255,255,255,0.02)",
                borderRadius: 1,
                border: "1px solid var(--border)",
                flexDirection: "column",
                alignItems: "stretch",
                p: 0,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1,
                  pl: 2,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                }}
                onClick={() => toggleRequestExpansion(req.requestId)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {req.requestId}
                      </Typography>
                      <Typography variant="caption" color="var(--muted)">
                        - {req.requestedBy}
                      </Typography>
                      {expandedRequestIds.has(req.requestId) ? (
                        <ChevronUp size={14} color="var(--muted)" />
                      ) : (
                        <ChevronDown size={14} color="var(--muted)" />
                      )}
                    </Box>
                  }
                  secondary={`${req.items.filter((i) => !i.assignedVoyageId).length} available items · Total Weight: ${req.items
                    .filter((i) => !i.assignedVoyageId)
                    .reduce((sum, i) => sum + (i.weight || 0), 0)
                    .toFixed(1)}t`}
                />
                <Button
                  variant="outlined"
                  size="small"
                  disabled={processingRequestId === req.requestId}
                  startIcon={
                    processingRequestId === req.requestId ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <Plus size={14} />
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddRequest(req.requestId);
                  }}
                >
                  Add All
                </Button>
              </Box>

              <Collapse
                in={expandedRequestIds.has(req.requestId)}
                timeout="auto"
                unmountOnExit
              >
                <Box
                  sx={{
                    p: 1,
                    pt: 0,
                    bgcolor: "rgba(0,0,0,0.1)",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1,
                      py: 0.5,
                      color: "var(--muted)",
                      fontWeight: 600,
                      display: "block",
                    }}
                  >
                    AVAILABLE ITEMS
                  </Typography>
                  {req.items
                    .filter((i) => !i.assignedVoyageId)
                    .map((item) => (
                      <Box
                        key={item.itemId}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 1,
                          bgcolor: "rgba(255,255,255,0.02)",
                          mb: 0.5,
                          borderRadius: 1,
                        }}
                      >
                        <Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {item.itemTypeName || item.description}
                            {item.isHazardous && (
                              <Tooltip title="Hazardous Material">
                                <Box
                                  sx={{ color: "error.main", display: "flex" }}
                                >
                                  <ShieldAlert size={12} />
                                </Box>
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="caption" color="var(--muted)">
                            {formatNumber(item.quantity)}{" "}
                            {item.unitOfMeasurement} ·{" "}
                            {item.weight
                              ? `${formatNumber(item.weight, 1)}t`
                              : "-"}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={
                            processingItemId === item.itemId ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <Plus size={14} />
                            )
                          }
                          disabled={!!processingItemId || !!processingRequestId}
                          onClick={() => handleAddItem(item.itemId)}
                        >
                          Add
                        </Button>
                      </Box>
                    ))}
                </Box>
              </Collapse>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

function AssignedRequestsList({
  assignedRequests,
  setIsAddingMode,
  isLoadingManifest,
  handleRemoveRequest,
  handleDeleteItem,
  processingRequestId,
  processingItemId,
}: {
  assignedRequests: MovementRequest[];
  setIsAddingMode: (val: boolean) => void;
  isLoadingManifest: boolean;
  handleRemoveRequest: (id: string) => void;
  handleDeleteItem: (reqId: string, itemId: string) => void;
  processingRequestId: string | null;
  processingItemId: string | null;
}) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="subtitle2">Manifest Items</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Plus size={14} />}
          onClick={() => setIsAddingMode(true)}
          sx={{ bgcolor: "var(--accent)" }}
        >
          Add Request
        </Button>
      </Box>

      {isLoadingManifest ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 8,
          }}
        >
          <CircularProgress size={32} />
        </Box>
      ) : assignedRequests.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ textAlign: "center", py: 4, color: "var(--muted)" }}
        >
          No items assigned to this manifest yet.
        </Typography>
      ) : (
        assignedRequests.map((req) => (
          <Box
            key={req.requestId}
            sx={{
              mb: 2,
              borderRadius: 1,
              border: "1px solid var(--border)",
              bgcolor: "rgba(255,255,255,0.01)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                px: 1.5,
                py: 1,
                bgcolor: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="var(--accent)"
                >
                  {req.requestId}
                </Typography>
                <Chip
                  label={`Req: ${req.requestedBy || "Unknown"}`}
                  size="small"
                  sx={{ height: 18, fontSize: 9, opacity: 0.8 }}
                />
                {req.businessUnitName && (
                  <Chip
                    label={`BU: ${req.businessUnitName}`}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 18, fontSize: 9, opacity: 0.8 }}
                  />
                )}
                <Typography variant="caption" color="var(--muted)">
                  {req.items.length} items ·{" "}
                  {formatNumber(
                    req.items.reduce((sum, i) => sum + (i.weight || 0), 0),
                    1,
                  )}
                  t
                </Typography>
                {req.isHazardous && (
                  <Chip
                    icon={<ShieldAlert size={12} />}
                    label="HAZARDOUS"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ height: 18, fontSize: 9, fontWeight: 700 }}
                  />
                )}
              </Box>
              <Tooltip title="Remove Entire Request">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveRequest(req.requestId)}
                  disabled={!!processingRequestId || !!processingItemId}
                >
                  {processingRequestId === req.requestId ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ p: 0 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1.5fr 1fr 40px",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderBottom: "1px solid var(--border)",
                  bgcolor: "rgba(0,0,0,0.1)",
                }}
              >
                <Typography
                  sx={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}
                >
                  ITEM TYPE
                </Typography>
                <Typography
                  sx={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}
                >
                  QTY / UNIT
                </Typography>
                <Typography
                  sx={{ fontSize: 9, fontWeight: 700, color: "var(--muted)" }}
                >
                  DIMENSIONS
                </Typography>
                <Typography
                  sx={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textAlign: "right",
                    pr: 1,
                  }}
                >
                  WEIGHT
                </Typography>
                <Box />
              </Box>

              {req.items.map((item, idx) => (
                <Box
                  key={item.itemId}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1.5fr 1fr 40px",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    alignItems: "center",
                    borderTop:
                      idx > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography variant="caption" fontWeight={500}>
                      {item.itemTypeName ||
                        item.itemTypeId ||
                        item.description ||
                        "N/A"}
                    </Typography>
                    {item.isHazardous && (
                      <Tooltip title="Hazardous Material">
                        <Box sx={{ color: "error.main", display: "flex" }}>
                          <ShieldAlert size={12} />
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="caption">
                    {formatNumber(item.quantity)} {item.unitOfMeasurement}
                  </Typography>
                  <Typography variant="caption" color="var(--muted)">
                    {item.dimensions || "—"}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ textAlign: "right", pr: 1, fontWeight: 600 }}
                  >
                    {item.weight ? `${formatNumber(item.weight, 1)}t` : "—"}
                  </Typography>
                  <Tooltip title="Delete Item">
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleDeleteItem(req.requestId, item.itemId)
                      }
                      disabled={!!processingRequestId || !!processingItemId}
                      sx={{
                        color: "var(--muted)",
                        "&:hover": { color: "error.main" },
                      }}
                    >
                      {processingItemId === item.itemId ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <X size={14} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          </Box>
        ))
      )}
    </Box>
  );
}

function parseArea(
  dimensions: string | undefined,
  qty: number,
  unit: string | undefined,
): number {
  if (!dimensions || dimensions === "0 x 0 x 0") return 0;
  const parts = dimensions
    .toLowerCase()
    .split("x")
    .map((p) => parseFloat(p.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    let area = parts[0] * parts[1];
    if (unit) {
      switch (unit.toLowerCase()) {
        case "ft":
        case "ft3":
          area = area * 0.092903;
          break;
        case "in":
        case "in3":
          area = area * 0.00064516;
          break;
        case "cm":
        case "cm3":
          area = area * 0.0001;
          break;
      }
    }
    return area * qty;
  }
  return 0;
}
