import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Divider,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CheckCircle2,
  XCircle,
  Ship,
  Package,
  ChevronLeft,
  Calendar,
} from "lucide-react";
import dayjs from "dayjs";
import { getMovementRequestById } from "../services/maritime/marineMovementService";
import {
  approveRequest,
  rejectRequest,
} from "../services/maritime/movementRequestApprovalService";
import type { MovementRequest } from "../types/maritime/logistics";
import { LoadingIndicator } from "../components/common/LoadingIndicator";

export function MarineApprovalPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<MovementRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        const data = await getMovementRequestById(requestId);
        setRequest(data);
      } catch (err) {
        console.error("Failed to fetch request", err);
        setError("Request not found or you don't have permission to view it.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const handleApprove = async () => {
    if (!requestId) return;
    setActionLoading(true);
    try {
      await approveRequest(requestId);
      setSuccessMsg(
        "Request approved successfully. The items have been assigned to the voyage.",
      );
      setTimeout(() => navigate("/approval-dashboard"), 2000);
    } catch (err) {
      setError("Failed to approve request.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!requestId || !comments) {
      setError("Comments are required for rejection.");
      return;
    }
    setActionLoading(true);
    try {
      await rejectRequest(requestId, comments);
      setSuccessMsg("Request rejected.");
      setTimeout(() => navigate("/approval-dashboard"), 2000);
    } catch (err) {
      setError("Failed to reject request.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingIndicator />;

  if (error && !request) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ChevronLeft size={18} />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!request) return null;

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Button
          variant="text"
          startIcon={<ChevronLeft size={18} />}
          onClick={() => navigate(-1)}
          sx={{ color: "var(--text-secondary)" }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight={800}>
          Marine Approval Request
        </Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 4, borderRadius: "12px" }}>
          {successMsg}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 4,
              borderRadius: "24px",
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}
            >
              <Box>
                <Typography variant="caption" color="var(--text-secondary)">
                  ORIGIN
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {request.originName}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  px: 4,
                }}
              >
                <Ship size={24} color="var(--accent)" />
                <Box
                  sx={{
                    width: "100%",
                    height: 2,
                    bgcolor: "var(--border)",
                    mt: 1,
                  }}
                />
                <Typography variant="caption" sx={{ mt: 1 }}>
                  {request.requestId}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="var(--text-secondary)">
                  DESTINATION
                </Typography>
                <Typography variant="h5" fontWeight={800}>
                  {request.destinationName}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography
                  variant="caption"
                  color="var(--text-secondary)"
                  display="block"
                >
                  DEPARTURE
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {dayjs(request.earliestDeparture).format("DD MMM YYYY")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography
                  variant="caption"
                  color="var(--text-secondary)"
                  display="block"
                >
                  ARRIVAL
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {dayjs(request.latestArrival).format("DD MMM YYYY")}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography
                  variant="caption"
                  color="var(--text-secondary)"
                  display="block"
                >
                  URGENCY
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {request.urgency || "Routine"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography
                  variant="caption"
                  color="var(--text-secondary)"
                  display="block"
                >
                  STATUS
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="var(--accent)"
                >
                  {request.status}
                </Typography>
              </Grid>
            </Grid>

            {request.selectedVoyageId && (
              <Box
                sx={{
                  mb: 4,
                  p: 2,
                  borderRadius: "16px",
                  bgcolor: "var(--accent-soft)",
                  border: "1px solid var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Calendar size={20} color="var(--accent)" />
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--accent)", fontWeight: 700 }}
                  >
                    SELECTED VOYAGE
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {request.vesselName || "Unknown Vessel"}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 3, mt: 0.5 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--text-secondary)",
                          display: "block",
                        }}
                      >
                        DEPARTURE
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {request.scheduledDeparture
                          ? dayjs(request.scheduledDeparture).format(
                              "DD MMM, HH:mm",
                            )
                          : "-"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "var(--text-secondary)",
                          display: "block",
                        }}
                      >
                        ARRIVAL
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {request.scheduledArrival
                          ? dayjs(request.scheduledArrival).format(
                              "DD MMM, HH:mm",
                            )
                          : "-"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}

            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Items Manifest
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {request.items.map((item) => (
                <Box
                  key={item.itemId}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: "var(--panel-hover)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Package size={18} />
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {item.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="var(--text-secondary)"
                      >
                        {item.itemTypeName} • {item.quantity}{" "}
                        {item.unitOfMeasurement}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="body2" fontWeight={700}>
                      {item.weight} t
                    </Typography>
                    <Typography variant="caption" color="var(--text-secondary)">
                      {item.dimensions} {item.dimensionUnit}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {request.comments && (
              <>
                <Typography variant="h6" fontWeight={700} sx={{ mt: 4, mb: 1 }}>
                  Requester Note
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    p: 2,
                    bgcolor: "var(--panel-hover)",
                    borderRadius: "12px",
                    fontStyle: "italic",
                  }}
                >
                  "{request.comments}"
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{
              p: 4,
              borderRadius: "24px",
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              position: "sticky",
              top: 20,
            }}
          >
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Approval Actions
            </Typography>

            <TextField
              fullWidth
              label="Approver Comments"
              multiline
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter reason for approval or rejection..."
              sx={{ mb: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={
                actionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <CheckCircle2 size={20} />
                )
              }
              onClick={handleApprove}
              disabled={actionLoading || request.status !== "Pending"}
              sx={{
                py: 1.5,
                borderRadius: "12px",
                mb: 2,
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Approve Request
            </Button>

            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={
                actionLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <XCircle size={20} />
                )
              }
              onClick={handleReject}
              disabled={actionLoading || request.status !== "Pending"}
              sx={{
                py: 1.5,
                borderRadius: "12px",
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Reject Request
            </Button>

            {request.status !== "Pending" && (
              <Typography
                variant="caption"
                color="var(--text-secondary)"
                sx={{ mt: 2, display: "block", textAlign: "center" }}
              >
                This request has already been {request.status.toLowerCase()}.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
