import {
  Box,
  Chip,
  Typography,
  Drawer,
  IconButton,
  Divider,
  Paper,
  Stack,
  Grid,
  Button,
} from "@mui/material";
import type {
  MovementRequest,
  MovementRequestItem,
  BusinessUnitOption,
  RequestTypeOption,
} from "../../types/maritime/logistics";
import {
  getBusinessUnits,
  getRequestTypes,
} from "../../services/maritime/referenceDataService";
import {
  AlertCircle,
  Zap,
  ShieldAlert,
  Clock,
  RefreshCw,
  X,
  Package,
  Ruler,
  Weight,
  Info,
  MapPin,
  Search,
} from "lucide-react";
import dayjs from "dayjs";
import { useState, useEffect } from "react";

interface RequestQueueProps {
  requests: MovementRequest[];
}

export function RequestQueue({ requests }: RequestQueueProps) {
  const [selectedRequest, setSelectedRequest] =
    useState<MovementRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [types, bus] = await Promise.all([
        getRequestTypes(),
        getBusinessUnits(),
      ]);
      setRequestTypes(types);
      setBusinessUnits(bus);
    };
    loadData();
  }, []);

  const getBusinessUnitName = (id: string | undefined): string => {
    if (!id) return "N/A";
    const bu = businessUnits.find((b) => b.businessUnitId === id);
    return bu ? bu.businessUnit : id;
  };

  const getRequestTypeName = (
    type: string | undefined,
    typeId: string | undefined,
  ): string => {
    if (type) return type;
    if (!typeId) return "N/A";
    const t = requestTypes.find((rt) => rt.requestTypeId === typeId);
    return t ? t.requestType : typeId;
  };

  const handleCardClick = (req: MovementRequest) => {
    setSelectedRequest(req);
  };

  const handleClosePeek = () => {
    setSelectedRequest(null);
  };
  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case "Urgent":
      case "Production Critical":
      case "Project Critical":
      case "Production Critical (deferment risk)":
        return {
          color: "#ef4444",
          bg: "rgba(239, 68, 68, 0.1)",
          icon: <Zap size={10} />,
        };
      case "HSSE / Regulatory":
      case "Priority":
      case "HSE / Regulatory":
      case "Project Critical Path":
        return {
          color: "#f59e0b",
          bg: "rgba(245, 158, 11, 0.1)",
          icon: <AlertCircle size={10} />,
        };
      case "Just In Time":
        return {
          color: "#8b5cf6",
          bg: "rgba(139, 92, 246, 0.1)",
          icon: <Clock size={10} />,
        };
      case "Milk Run":
        return {
          color: "#06b6d4",
          bg: "rgba(6, 182, 212, 0.1)",
          icon: <RefreshCw size={10} />,
        };
      case "Routine":
      case "Routine Ops":
      case "Nice-to-have":
      default:
        return {
          color: "#3b82f6",
          bg: "rgba(59, 130, 246, 0.1)",
          icon: null,
        };
    }
  };

  return (
    <aside className="panel-container">
      <Box
        className="panel-header-custom"
        sx={{ flexDirection: "column", alignItems: "flex-start", gap: 0.5 }}
      >
        <Box className="panel-title-custom">
          <span className="panel-title-dot"></span>
          <span>Movement Request Queue</span>
        </Box>
        <span
          style={{
            fontSize: 10,
            color: "var(--muted)",
            marginLeft: "14px",
            fontWeight: 500,
          }}
        >
          Drag to assign →
        </span>
      </Box>
      <Box className="panel-body-scroll">
        <Box className="queue-section-box">
          <Box className="queue-section-title-box">
            <span>
              <span className="pill-dot pill-red"></span> Unscheduled
            </span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>
              {requests.length}
            </span>
          </Box>

          <Box
            sx={{
              px: 2,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                px: 1,
                py: 0.5,
                flex: 1,
                transition: "all 0.2s",
                "&:focus-within": {
                  borderColor: "var(--accent)",
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.1)",
                },
              }}
            >
              <Search size={14} color="var(--muted)" />
              <input
                type="text"
                placeholder="Search requests or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "11px",
                  color: "var(--text)",
                  width: "100%",
                  marginLeft: "8px",
                  fontFamily: "inherit",
                }}
              />
              {searchQuery && (
                <X
                  size={12}
                  color="var(--muted)"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSearchQuery("")}
                />
              )}
            </Box>
          </Box>

          {requests.filter((req) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            const matchesId = req.requestId.toLowerCase().includes(query);
            const matchesItems = req.items.some(
              (item) =>
                (item.itemTypeName?.toLowerCase() || "").includes(query) ||
                (item.description?.toLowerCase() || "").includes(query),
            );
            return matchesId || matchesItems;
          }).length === 0 ? (
            <Typography
              variant="caption"
              sx={{
                color: "var(--muted)",
                textAlign: "center",
                display: "block",
                my: 2,
              }}
            >
              {requests.length === 0
                ? "No unscheduled requests"
                : "No matching requests"}
            </Typography>
          ) : (
            requests
              .filter((req) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                const matchesId = req.requestId.toLowerCase().includes(query);
                const matchesItems = req.items.some(
                  (item) =>
                    (item.itemTypeName?.toLowerCase() || "").includes(query) ||
                    (item.description?.toLowerCase() || "").includes(query),
                );
                return matchesId || matchesItems;
              })
              .map((req) => {
                const style = getUrgencyStyle(req.urgency || "Routine");
                return (
                  <Box
                    key={req.requestId}
                    className="queue-item-card"
                    onClick={() => handleCardClick(req)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("requestId", req.requestId);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    sx={{ cursor: "grab", "&:active": { cursor: "grabbing" } }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 0.5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--text)",
                        }}
                      >
                        {req.requestId}
                      </span>
                      <Box
                        sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            backgroundColor: "var(--success)",
                          }}
                        ></span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--muted)",
                          }}
                        >
                          {req.originName || req.originId} →{" "}
                          {req.destinationName || req.destinationId}
                        </span>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        fontSize: 9,
                        color: "var(--muted)",
                        mb: 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Clock size={9} />
                        <span style={{ fontWeight: 500 }}>ED:</span>
                        <span>
                          {dayjs(req.earliestDeparture).format("DD MMM HH:mm")}
                        </span>
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <span style={{ fontWeight: 500 }}>LA:</span>
                        <span>
                          {dayjs(req.latestArrival).format("DD MMM HH:mm")}
                        </span>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        fontSize: 9,
                        color: "var(--muted)",
                        mb: 0.75,
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        <Package size={9} />
                        <span>
                          {req.items?.length || 0}{" "}
                          {req.items?.length === 1 ? "item" : "items"}
                        </span>
                      </Box>
                      <span>·</span>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        <Weight size={9} />
                        <span>{req.totalWeight?.toFixed(1)}t</span>
                      </Box>
                      <span>·</span>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.25,
                        }}
                      >
                        <Ruler size={9} />
                        <span>{req.totalDeckArea?.toFixed(1)}m²</span>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={req.urgency}
                        size="small"
                        icon={style.icon || undefined}
                        sx={{
                          height: 16,
                          fontSize: "8px",
                          fontWeight: 600,
                          color: style.color,
                          bgcolor: style.bg,
                          border: `1px solid ${style.color}40`,
                          "& .MuiChip-icon": {
                            color: "inherit",
                            ml: "3px",
                            mr: "-3px",
                            width: 8,
                            height: 8,
                          },
                        }}
                      />
                      {req.isHazardous && (
                        <Chip
                          label="Hazardous"
                          size="small"
                          icon={<ShieldAlert size={8} />}
                          sx={{
                            height: 16,
                            fontSize: "8px",
                            fontWeight: 600,
                            color: "#f43f5e",
                            bgcolor: "rgba(244, 63, 94, 0.1)",
                            border: "1px solid rgba(244, 63, 94, 0.4)",
                            "& .MuiChip-icon": {
                              color: "inherit",
                              ml: "3px",
                              mr: "-3px",
                            },
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })
          )}
        </Box>

        <Box className="queue-section-box" sx={{ mt: 2, opacity: 0.6 }}>
          <Box className="queue-section-title-box">
            <span>
              <span className="pill-dot pill-yellow"></span> At Risk
            </span>
            <span style={{ fontSize: 10, color: "var(--muted)" }}>0</span>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: "var(--muted)",
              textAlign: "center",
              display: "block",
              my: 1,
            }}
          >
            All clear
          </Typography>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={!!selectedRequest}
        onClose={handleClosePeek}
        PaperProps={{
          sx: {
            width: 400,
            bgcolor: "var(--bg)",
            borderLeft: "1px solid var(--border)",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
          },
        }}
      >
        {selectedRequest && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "var(--panel)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "var(--muted)",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Request Details
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "var(--text)",
                    fontWeight: 600,
                    fontSize: "1.1rem",
                  }}
                >
                  {selectedRequest.requestId}
                </Typography>
              </Box>
              <IconButton
                onClick={handleClosePeek}
                size="small"
                sx={{ color: "var(--text)" }}
              >
                <X size={20} />
              </IconButton>
            </Box>

            {/* Scrollable Content */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
              <Stack spacing={2.5}>
                {/* Route & Status Section */}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: "rgba(59, 130, 246, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#3b82f6",
                        }}
                      >
                        <MapPin size={16} />
                      </Box>
                      <Box
                        sx={{
                          width: 1,
                          height: 20,
                          bgcolor: "var(--border)",
                          opacity: 0.5,
                        }}
                      ></Box>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: "rgba(16, 185, 129, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#10b981",
                        }}
                      >
                        <MapPin size={16} />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--muted)",
                            display: "block",
                            mb: 0.25,
                          }}
                        >
                          Origin
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedRequest.originName ||
                            selectedRequest.originId}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--muted)",
                            display: "block",
                            mb: 0.25,
                          }}
                        >
                          Destination
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedRequest.destinationName ||
                            selectedRequest.destinationId}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Divider
                    sx={{ my: 1.5, borderColor: "var(--border)", opacity: 0.5 }}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--muted)", display: "block" }}
                      >
                        Current Status
                      </Typography>
                      <Chip
                        label={selectedRequest.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          bgcolor: "rgba(59, 130, 246, 0.1)",
                          color: "#3b82f6",
                          mt: 0.5,
                        }}
                      />
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--muted)", display: "block" }}
                      >
                        Urgency
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {(() => {
                          const s = getUrgencyStyle(
                            selectedRequest.urgency || "Routine",
                          );
                          return (
                            <Chip
                              label={selectedRequest.urgency}
                              size="small"
                              icon={s.icon || undefined}
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: s.bg,
                                color: s.color,
                                "& .MuiChip-icon": {
                                  color: "inherit",
                                  width: 12,
                                  height: 12,
                                },
                              }}
                            />
                          );
                        })()}
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {/* Timeline Section */}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "var(--muted)",
                    }}
                  >
                    <Clock size={14} /> TIMELINE
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--muted)", display: "block" }}
                      >
                        Earliest Departure
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mt: 0.5 }}
                      >
                        {dayjs(selectedRequest.earliestDeparture).format(
                          "DD MMM YYYY",
                        )}
                        <br />
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {dayjs(selectedRequest.earliestDeparture).format(
                            "HH:mm",
                          )}
                        </span>
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--muted)", display: "block" }}
                      >
                        Latest Arrival
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, mt: 0.5 }}
                      >
                        {dayjs(selectedRequest.latestArrival).format(
                          "DD MMM YYYY",
                        )}
                        <br />
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>
                          {dayjs(selectedRequest.latestArrival).format("HH:mm")}
                        </span>
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Additional Info */}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "var(--panel)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "var(--muted)",
                    }}
                  >
                    <Info size={14} /> ADDITIONAL INFO
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--muted)", display: "block" }}
                      >
                        Business Unit / Cost Centre
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {getBusinessUnitName(selectedRequest.businessUnitId)} /{" "}
                        {selectedRequest.costCentre || "N/A"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "var(--muted)", display: "block" }}
                      >
                        Request Type
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: 12 }}>
                        {getRequestTypeName(
                          selectedRequest.requestType,
                          selectedRequest.requestTypeId,
                        )}
                      </Typography>
                    </Box>
                    {selectedRequest.comments && (
                      <Box>
                        <Typography
                          variant="caption"
                          sx={{ color: "var(--muted)", display: "block" }}
                        >
                          Comments
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: 12,
                            fontStyle: "italic",
                            opacity: 0.8,
                          }}
                        >
                          "{selectedRequest.comments}"
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>

                {/* Items Section */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      mb: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: "var(--muted)",
                      px: 1,
                    }}
                  >
                    <Package size={14} /> ITEMS (
                    {selectedRequest.items?.length || 0})
                  </Typography>
                  <Stack spacing={1}>
                    {selectedRequest.items?.map((item: MovementRequestItem) => (
                      <Paper
                        key={item.itemId}
                        sx={{
                          p: 1.5,
                          bgcolor: "var(--panel)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, fontSize: 12 }}
                          >
                            {item.itemTypeName ||
                              item.description ||
                              "No description"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "var(--muted)", fontWeight: 700 }}
                          >
                            {item.quantity} {item.unitOfMeasurement}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}
                        >
                          {item.weight && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "var(--muted)",
                              }}
                            >
                              <Weight size={10} />
                              <Typography
                                variant="caption"
                                sx={{ fontSize: 10 }}
                              >
                                {item.weight}
                                {item.weightUnit || "t"}
                              </Typography>
                            </Box>
                          )}
                          {item.dimensions && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "var(--muted)",
                              }}
                            >
                              <Ruler size={10} />
                              <Typography
                                variant="caption"
                                sx={{ fontSize: 10 }}
                              >
                                {item.dimensions}
                              </Typography>
                            </Box>
                          )}
                          {item.isHazardous && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                                color: "#f43f5e",
                              }}
                            >
                              <ShieldAlert size={10} />
                              <Typography
                                variant="caption"
                                sx={{ fontSize: 10, fontWeight: 600 }}
                              >
                                Hazardous
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Footer / Actions */}
            <Box
              sx={{
                p: 2,
                bgcolor: "var(--panel)",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 1,
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                color="inherit"
                onClick={handleClosePeek}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: 12,
                }}
              >
                Close
              </Button>
              <Button
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: "var(--accent)",
                  color: "var(--panel)",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  "&:hover": { bgcolor: "var(--accent)", opacity: 0.9 },
                }}
              >
                Manage Request
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>
    </aside>
  );
}
