import React from "react";
import { Dialog, Typography, Button, Box, IconButton } from "@mui/material";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  isDeleting?: boolean;
}

export const DeleteConfirmationDialog: React.FC<
  DeleteConfirmationDialogProps
> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  isDeleting = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          backgroundImage: "none",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <Box sx={{ position: "absolute", right: 8, top: 8 }}>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "var(--text-secondary)" }}
        >
          <X size={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, textAlign: "center" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: "rgba(239, 68, 68, 0.1)",
            color: "var(--danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <AlertTriangle size={24} />
        </Box>

        <Typography variant="h6" fontWeight={700} gutterBottom>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {description}
        </Typography>

        {itemName && (
          <Typography
            variant="subtitle2"
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.05)",
              py: 1,
              px: 2,
              borderRadius: "8px",
              display: "inline-block",
              mb: 3,
              mt: 1,
              border: "1px solid var(--border)",
              fontWeight: 600,
            }}
          >
            {itemName}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
            disabled={isDeleting}
            sx={{
              borderColor: "var(--border)",
              color: "var(--text)",
              "&:hover": {
                borderColor: "var(--text-secondary)",
                bgcolor: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={onConfirm}
            disabled={isDeleting}
            sx={{
              bgcolor: "var(--danger)",
              "&:hover": { bgcolor: "#dc2626" },
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
