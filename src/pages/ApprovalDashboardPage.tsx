import { useState, useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { getPendingApprovals } from "../services/maritime/marineMovementService";
import {
  approveRequest,
  rejectRequest,
} from "../services/maritime/movementRequestApprovalService";
import type { MovementRequest } from "../types/maritime/logistics";
import { MarineHeader } from "../components/maritime/MarineHeader";
import { ApprovalStats } from "../components/approvals/ApprovalStats";
import { ApprovalTable } from "../components/approvals/ApprovalTable";
import { ApprovalDrawer } from "../components/approvals/ApprovalDrawer";

export function ApprovalDashboardPage() {
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<MovementRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [marine, aviation] = await Promise.all([
        getPendingApprovals("Marine"),
        getPendingApprovals("Aviation"),
      ]);
      setRequests([...marine, ...aviation]);
    } catch (error) {
      console.error("Failed to fetch pending approvals", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRowClick = async (request: MovementRequest) => {
    setSelectedRequest(request);
    setError(null);
    setSuccessMsg(null);
    setComments("");
    setDrawerOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest?.requestId) return;
    setActionLoading(true);
    setError(null);
    try {
      await approveRequest(
        selectedRequest.requestId,
        comments,
        selectedRequest.transportationMode as "Marine" | "Aviation",
      );
      const successMessage =
        "Request approved successfully. The items have been assigned to the voyage.";
      setSuccessMsg(successMessage);

      setTimeout(() => {
        setDrawerOpen(false);
        setLoading(true);
        fetchRequests();
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data || "Failed to approve request. Please try again.";
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest?.requestId || !comments) {
      setError("Comments are required for rejection.");
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      await rejectRequest(
        selectedRequest.requestId,
        comments,
        selectedRequest.transportationMode as "Marine" | "Aviation",
      );
      const successMessage = "Request rejected.";
      setSuccessMsg(successMessage);

      setTimeout(() => {
        setDrawerOpen(false);
        setLoading(true);
        fetchRequests();
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data || "Failed to reject request. Please try again.";
      setError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        bgcolor: "var(--bg)",
        mb: 4,
      }}
    >
      <MarineHeader
        title="Approval Dashboard"
        showFilters={false}
        hideActions={true}
        onRefresh={fetchRequests}
      />

      {loading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress sx={{ color: "var(--accent)" }} />
        </Box>
      ) : (
        <>
          <ApprovalStats requests={requests} />
          <ApprovalTable requests={requests} onRowClick={handleRowClick} />
        </>
      )}

      <ApprovalDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        request={selectedRequest}
        successMsg={successMsg}
        error={error}
        comments={comments}
        onCommentsChange={setComments}
        onApprove={handleApprove}
        onReject={handleReject}
        actionLoading={actionLoading}
      />
    </Box>
  );
}
