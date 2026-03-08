import {
  Box,
  Button,
  TextField,
  Divider,
  Typography,
  CircularProgress,
} from "@mui/material";
import { XCircle, CheckCircle2 } from "lucide-react";
import type { MovementRequest } from "../../types/maritime/logistics";

interface ApprovalActionsProps {
  request: MovementRequest;
  comments: string;
  onCommentsChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}

export function ApprovalActions({
  request,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
  loading,
}: ApprovalActionsProps) {
  return (
    <>
      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
        Approval Actions
      </Typography>

      <TextField
        fullWidth
        label="Approver Comments"
        multiline
        rows={2}
        value={comments}
        onChange={(e) => onCommentsChange(e.target.value)}
        placeholder="Enter reason for approval or rejection..."
        sx={{ mb: 3 }}
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <XCircle size={20} />
            )
          }
          onClick={onReject}
          disabled={loading || request.status !== "Pending"}
          sx={{
            py: 1.5,
            borderRadius: "12px",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Reject Request
        </Button>

        <Button
          fullWidth
          variant="contained"
          color="success"
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <CheckCircle2 size={20} />
            )
          }
          onClick={onApprove}
          disabled={loading || request.status !== "Pending"}
          sx={{
            py: 1.5,
            borderRadius: "12px",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Approve Request
        </Button>
      </Box>

      {request.status !== "Pending" && (
        <Typography
          variant="caption"
          color="var(--text-secondary)"
          sx={{ mt: 2, display: "block", textAlign: "center" }}
        >
          This request has already been {request.status.toLowerCase()}.
        </Typography>
      )}
    </>
  );
}
