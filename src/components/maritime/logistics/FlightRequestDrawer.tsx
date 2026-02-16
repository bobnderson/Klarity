import {
  Box,
  Typography,
  Drawer,
  IconButton,
  Divider,
  Paper,
  Stack,
  Grid,
  Chip,
} from "@mui/material";
import {
  X,
  MapPin,
  Clock,
  Package,
  Weight,
  Info,
  Plane,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import type {
  MovementRequest,
  BusinessUnitOption,
} from "../../../types/maritime/logistics";
import { getBusinessUnits } from "../../../services/maritime/referenceDataService";
import { getUrgencyStyle } from "../../../utils/statusUtils";

interface FlightRequestDrawerProps {
  open: boolean;
  onClose: () => void;
  request: MovementRequest | null;
}

export function FlightRequestDrawer({
  open,
  onClose,
  request,
}: FlightRequestDrawerProps) {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const bus = await getBusinessUnits();
        setBusinessUnits(bus);
      } catch (error) {
        console.error("Failed to load drawer data", error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  const getBusinessUnitName = (id: string | undefined): string => {
    if (!id) return "N/A";
    const bu = businessUnits.find((b) => b.businessUnitId === id);
    return bu ? bu.businessUnit : id;
  };

  if (!request) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 450,
          bgcolor: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            bgcolor: "var(--panel)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                mb: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Plane size={14} /> Flight Request Details
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "var(--text)",
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              {request.requestId}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "var(--text)",
              bgcolor: "var(--bg)",
              border: "1px solid var(--border)",
              "&:hover": { bgcolor: "var(--panel-hover)" },
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
          <Stack spacing={3}>
            {/* Route & Status Section */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                    pt: 0.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "12px",
                      bgcolor: "var(--accent-alpha)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--accent)",
                      boxShadow: "0 4px 12px rgba(255, 178, 0, 0.15)",
                    }}
                  >
                    <MapPin size={18} />
                  </Box>
                  <Box
                    sx={{
                      width: 2,
                      height: 24,
                      bgcolor: "var(--border)",
                      opacity: 0.5,
                      borderRadius: 1,
                    }}
                  ></Box>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "12px",
                      bgcolor: "rgba(16, 185, 129, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <MapPin size={18} />
                  </Box>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--muted)",
                        display: "block",
                        mb: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      DEPARTURE BASE
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 700, fontSize: "1rem" }}
                    >
                      {request.originName || request.originId || "TBD"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--muted)",
                        display: "block",
                        mb: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      ARRIVAL PLATFORM
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 700, fontSize: "1rem" }}
                    >
                      {request.destinationName ||
                        request.destinationId ||
                        "TBD"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider
                sx={{ my: 2, borderColor: "var(--border)", opacity: 0.5 }}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--muted)",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Current Status
                  </Typography>
                  <Chip
                    label={request.status}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: 11,
                      fontWeight: 700,
                      bgcolor:
                        request.status === "Approved"
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(59, 130, 246, 0.1)",
                      color:
                        request.status === "Approved" ? "#10b981" : "#3b82f6",
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--muted)",
                      display: "block",
                      mb: 0.5,
                    }}
                  >
                    Urgency
                  </Typography>
                  {(() => {
                    const s = getUrgencyStyle(
                      (request as any).urgency || "Routine",
                    );
                    const Icon =
                      s.icon === "Zap"
                        ? Zap
                        : s.icon === "AlertCircle"
                          ? AlertCircle
                          : s.icon === "Clock"
                            ? Clock
                            : s.icon === "RefreshCw"
                              ? RefreshCw
                              : null;
                    return (
                      <Chip
                        label={(request as any).urgency || "Routine"}
                        size="small"
                        icon={Icon ? <Icon size={12} /> : undefined}
                        sx={{
                          height: 24,
                          fontSize: 11,
                          fontWeight: 700,
                          bgcolor: s.bg,
                          color: s.color,
                          "& .MuiChip-icon": {
                            color: "inherit",
                            width: 14,
                            height: 14,
                          },
                        }}
                      />
                    );
                  })()}
                </Grid>
              </Grid>
            </Paper>

            {/* Timeline Section */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                <Clock size={16} /> Schedule Window
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--muted)", display: "block", mb: 0.5 }}
                  >
                    {request.scheduledDeparture
                      ? "Scheduled Departure"
                      : "Earliest Departure"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "0.95rem" }}
                  >
                    {dayjs(
                      request.scheduledDeparture || request.earliestDeparture,
                    ).format("DD MMM YYYY")}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--text-secondary)",
                      fontFamily: "monospace",
                    }}
                  >
                    {dayjs(
                      request.scheduledDeparture || request.earliestDeparture,
                    ).format("HH:mm")}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--muted)", display: "block", mb: 0.5 }}
                  >
                    {request.scheduledArrival
                      ? "Scheduled Arrival"
                      : "Latest Arrival"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, fontSize: "0.95rem" }}
                  >
                    {dayjs(
                      request.scheduledArrival || request.latestArrival,
                    ).format("DD MMM YYYY")}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--text-secondary)",
                      fontFamily: "monospace",
                    }}
                  >
                    {dayjs(
                      request.scheduledArrival || request.latestArrival,
                    ).format("HH:mm")}
                  </Typography>
                </Grid>
              </Grid>

              {(request.tripType === "RoundTrip" ||
                request.returnScheduledDeparture ||
                request.returnVoyageId) && (
                <>
                  <Divider sx={{ my: 2, borderStyle: "dashed" }} />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: 11,
                      fontWeight: 700,
                      mb: 1.5,
                      color: "var(--accent)",
                      textTransform: "uppercase",
                    }}
                  >
                    Return Flight Window
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--muted)",
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        {request.returnScheduledDeparture
                          ? "Scheduled Departure"
                          : "Return Departure"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.95rem" }}
                      >
                        {request.returnScheduledDeparture
                          ? dayjs(request.returnScheduledDeparture).format(
                              "DD MMM YYYY",
                            )
                          : request.returnEarliestDeparture
                            ? dayjs(request.returnEarliestDeparture).format(
                                "DD MMM YYYY",
                              )
                            : "-"}
                      </Typography>
                      {request.returnScheduledDeparture && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--text-secondary)",
                            fontFamily: "monospace",
                          }}
                        >
                          {dayjs(request.returnScheduledDeparture).format(
                            "HH:mm",
                          )}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--muted)",
                          display: "block",
                          mb: 0.5,
                        }}
                      >
                        {request.returnScheduledArrival
                          ? "Scheduled Arrival"
                          : "Return Arrival"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontSize: "0.95rem" }}
                      >
                        {request.returnScheduledArrival
                          ? dayjs(request.returnScheduledArrival).format(
                              "DD MMM YYYY",
                            )
                          : request.returnLatestArrival
                            ? dayjs(request.returnLatestArrival).format(
                                "DD MMM YYYY",
                              )
                            : "-"}
                      </Typography>
                      {request.returnScheduledArrival && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: "var(--text-secondary)",
                            fontFamily: "monospace",
                          }}
                        >
                          {dayjs(request.returnScheduledArrival).format(
                            "HH:mm",
                          )}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </>
              )}
            </Paper>

            {/* Cargo/Pax Info */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                <Package size={16} /> Payload Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, textAlign: "center", bgcolor: "var(--bg)" }}
                  >
                    <Package
                      size={18}
                      color="var(--accent)"
                      style={{ marginBottom: 4 }}
                    />
                    <Typography variant="h6" fontWeight={700}>
                      {request.items?.length || 0}
                    </Typography>
                    <Typography variant="caption" color="var(--muted)">
                      Passenger(s)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, textAlign: "center", bgcolor: "var(--bg)" }}
                  >
                    <Weight
                      size={18}
                      color="var(--success)"
                      style={{ marginBottom: 4 }}
                    />
                    <Typography variant="h6" fontWeight={700}>
                      {(request.totalWeight || 0).toFixed(1)}t
                    </Typography>
                    <Typography variant="caption" color="var(--muted)">
                      Weight
                    </Typography>
                  </Paper>
                </Grid>
                {/* <Grid size={{ xs: 4 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1.5, textAlign: "center", bgcolor: "var(--bg)" }}
                  >
                    <Ruler
                      size={18}
                      color="#8b5cf6"
                      style={{ marginBottom: 4 }}
                    />
                    <Typography variant="h6" fontWeight={700}>
                      {(request.totalDeckArea || 0).toFixed(1)}m²
                    </Typography>
                    <Typography variant="caption" color="var(--muted)">
                      Volume
                    </Typography>
                  </Paper>
                </Grid> */}
              </Grid>

              {request.items && request.items.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Divider
                    sx={{
                      my: 2,
                      borderColor: "var(--border)",
                      borderStyle: "dashed",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--muted)",
                      fontWeight: 600,
                      mb: 1,
                      display: "block",
                    }}
                  >
                    PAX MANIFEST
                  </Typography>
                  <Stack spacing={1}>
                    {request.items.map((item, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.85rem",
                        }}
                      >
                        <Typography variant="body2">
                          {item.description}
                        </Typography>
                        <Typography variant="caption" color="var(--muted)">
                          x {item.quantity}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>

            {/* Additional Info */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "var(--panel)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                <Info size={16} /> Logistics Context
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--muted)", display: "block" }}
                  >
                    Business Unit / Cost Centre
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {getBusinessUnitName(request.businessUnitId)}
                  </Typography>
                  <Typography variant="caption" color="var(--text-secondary)">
                    {request.costCentre || "No cost centre specified"}
                  </Typography>
                </Box>
                {request.comments && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--muted)", display: "block" }}
                    >
                      Instructions / Notes
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 1.5, bgcolor: "var(--bg)", mt: 0.5 }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontSize: "0.85rem", fontStyle: "italic" }}
                      >
                        "{request.comments}"
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
