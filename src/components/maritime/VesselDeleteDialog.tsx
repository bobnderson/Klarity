import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { AlertTriangle } from "lucide-react";

interface VesselDeleteDialogProps {
  open: boolean;
  vesselName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function VesselDeleteDialog({
  open,
  vesselName,
  onClose,
  onConfirm,
}: VesselDeleteDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(reason);
    setReason("");
    setError(false);
  };

  const handleClose = () => {
    setReason("");
    setError(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          bgcolor: "#0f172a",
          border: "1px solid var(--border)",
          color: "var(--text)",
          minWidth: "400px",
        },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <AlertTriangle color="var(--destructive)" size={24} />
        Delete Vessel
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
          Are you sure you want to delete <strong>{vesselName}</strong>? This
          action cannot be undone.
        </Typography>

        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
          Please provide a reason for deletion{" "}
          <span style={{ color: "var(--destructive)" }}>*</span>
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (e.target.value.trim()) setError(false);
          }}
          placeholder="e.g., Vessel sold, Decommissioned, Data entry error..."
          error={error}
          helperText={error ? "Reason is required" : ""}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255, 255, 255, 0.05)",
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} sx={{ color: "var(--text)" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          color="error"
          sx={{ bgcolor: "var(--destructive)" }}
        >
          Delete Vessel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
