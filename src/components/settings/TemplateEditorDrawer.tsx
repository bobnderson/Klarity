import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Drawer,
  TextField,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Save, X, Info, Code } from "lucide-react";
import { type NotificationTemplate } from "../../services/settings/notificationService";

// --- Utilities ---

export const beautifyHtml = (html: string) => {
  if (!html) return "";
  let formatted = "";
  let indent = "";
  const tab = "  ";

  // Basic beautifier: split by tags, filter out empty, and rebuild with indentation
  html
    .replace(/>\s*</g, ">\n<")
    .split("\n")
    .forEach((line) => {
      line = line.trim();
      if (line.match(/^<\/\w/)) {
        // Closing tag: decrease indent before adding
        indent = indent.substring(tab.length);
      }

      formatted += indent + line + "\n";

      if (
        line.match(/^<\w[^>]*[^\/]>$/) &&
        !line.match(
          /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/,
        )
      ) {
        // Opening tag (not self-closing or void): increase indent after adding
        indent += tab;
      }
    });

  return formatted.trim();
};

interface TemplateEditorDrawerProps {
  template: NotificationTemplate | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  saveLoading: boolean;
  getPlaceholders: (id: string) => string[];
}

export const TemplateEditorDrawer = ({
  template,
  open,
  onClose,
  onSave,
  onInputChange,
  saveLoading,
  getPlaceholders,
}: TemplateEditorDrawerProps) => {
  const handleFormat = () => {
    if (template) {
      onInputChange({
        target: {
          name: "bodyHtml",
          value: beautifyHtml(template.bodyHtml),
        },
      } as any);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", md: 600 },
          bgcolor: "var(--panel)",
          color: "var(--text)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
        },
      }}
    >
      {template && (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Drawer Header */}
          <Box
            sx={{
              p: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight="600">
                Edit Template
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--text-secondary)" }}
              >
                {template.templateName}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{ color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </IconButton>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ p: 4, flexGrow: 1, overflowY: "auto" }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1.5,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                Email Subject
              </Typography>
              <TextField
                fullWidth
                name="subject"
                value={template.subject}
                onChange={onInputChange}
                placeholder="Enter email subject"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "var(--panel-hover)",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--accent)" },
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "var(--text-secondary)" }}
                >
                  HTML Body Content
                </Typography>
                <Button
                  size="small"
                  startIcon={<Code size={14} />}
                  onClick={handleFormat}
                  sx={{
                    fontSize: "10px",
                    py: 0.25,
                    color: "var(--accent)",
                    "&:hover": { bgcolor: "var(--accent-alpha)" },
                  }}
                >
                  Format HTML
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={15}
                name="bodyHtml"
                value={template.bodyHtml}
                onChange={onInputChange}
                placeholder="Enter HTML template content"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "var(--panel-hover)",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    "& fieldset": { borderColor: "var(--border)" },
                    "&:hover fieldset": { borderColor: "var(--accent)" },
                  },
                }}
              />
            </Box>

            <Divider sx={{ mb: 3, borderStyle: "dashed" }} />

            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Info size={16} /> Available Placeholders
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {getPlaceholders(template.templateId).map((p) => (
                  <Box
                    key={p}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "4px",
                      bgcolor: "var(--border)",
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {p}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Drawer Footer */}
          <Box
            sx={{
              p: 3,
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              onClick={onClose}
              sx={{
                py: 1.25,
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={onSave}
              disabled={saveLoading}
              startIcon={
                saveLoading ? (
                  <CircularProgress size={18} />
                ) : (
                  <Save size={18} />
                )
              }
              sx={{
                py: 1.25,
                bgcolor: "var(--accent)",
                "&:hover": { bgcolor: "var(--accent)" },
              }}
            >
              {saveLoading ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
};
