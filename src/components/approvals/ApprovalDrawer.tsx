import {
  Box,
  Typography,
  IconButton,
  Alert,
  Grid,
  Drawer,
} from "@mui/material";
import { Ship, Plane, X } from "lucide-react";
import dayjs from "dayjs";
import type { MovementRequest } from "../../types/maritime/logistics";
import { SelectedVoyageInfo } from "./SelectedVoyageInfo";
import { ItemManifestList } from "./ItemManifestList";
import { ApprovalActions } from "./ApprovalActions";

interface ApprovalDrawerProps {
  open: boolean;
  onClose: () => void;
  request: MovementRequest | null;
  successMsg: string | null;
  error: string | null;
  comments: string;
  onCommentsChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  actionLoading: boolean;
}

export function ApprovalDrawer({
  open,
  onClose,
  request,
  successMsg,
  error,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
  actionLoading,
}: ApprovalDrawerProps) {
  if (!request) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 600 },
          bgcolor: "var(--panel)",
          backgroundImage: "none",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Box
          sx={{
            p: 3,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "var(--panel)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {request.transportationMode === "Aviation" ||
            request.requestId.startsWith("req-aviation") ? (
              <Plane size={24} color="var(--accent)" />
            ) : (
              <Ship size={24} color="var(--accent)" />
            )}
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Approval Request details
              </Typography>
              <Typography variant="caption" color="var(--text-secondary)">
                {request.requestId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, flex: 1, overflowY: "auto" }}>
          {successMsg && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>
              {successMsg}
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 4,
            }}
          >
            <Box>
              <Typography variant="caption" color="var(--text-secondary)">
                ORIGIN
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {request.originName}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                px: 4,
              }}
            >
              <Box sx={{ height: 2, flex: 1, bgcolor: "var(--border)" }} />
              <Box sx={{ mx: 2, color: "var(--accent)" }}>
                {request.transportationMode === "Aviation" ||
                request.requestId.startsWith("req-aviation") ? (
                  <Plane size={20} />
                ) : (
                  <Ship size={20} />
                )}
              </Box>
              <Box sx={{ height: 2, flex: 1, bgcolor: "var(--border)" }} />
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="var(--text-secondary)">
                DESTINATION
              </Typography>
              <Typography variant="h6" fontWeight={800}>
                {request.destinationName}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="var(--text-secondary)">
                DEPARTURE
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {dayjs(request.earliestDeparture).format("DD MMM YYYY")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="var(--text-secondary)">
                ARRIVAL
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {dayjs(request.latestArrival).format("DD MMM YYYY")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="var(--text-secondary)">
                URGENCY
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {request.urgency || "Routine"}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="var(--text-secondary)">
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

          <SelectedVoyageInfo request={request} />
          <ItemManifestList request={request} />

          {request.comments && (
            <>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Requester Note
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 2,
                  bgcolor: "var(--panel-hover)",
                  borderRadius: "12px",
                  fontStyle: "italic",
                  mb: 4,
                }}
              >
                "{request.comments}"
              </Typography>
            </>
          )}

          <ApprovalActions
            request={request}
            comments={comments}
            onCommentsChange={onCommentsChange}
            onApprove={onApprove}
            onReject={onReject}
            loading={actionLoading}
          />
        </Box>
      </Box>
    </Drawer>
  );
}
