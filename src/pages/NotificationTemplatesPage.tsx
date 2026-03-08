import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Drawer,
  TextField,
  Divider,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Mail, Edit, Save, X, Info } from "lucide-react";
import { toast } from "react-toastify";
import {
  getTemplates,
  updateTemplate,
  type NotificationTemplate,
} from "../services/settings/notificationService";

export const NotificationTemplatesPage = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] =
    useState<NotificationTemplate | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (template: NotificationTemplate) => {
    setEditingTemplate({ ...template });
  };

  const handleCloseEdit = () => {
    setEditingTemplate(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (!editingTemplate) return;
    const { name, value } = e.target;
    setEditingTemplate({ ...editingTemplate, [name]: value });
  };

  const handleSave = async () => {
    if (!editingTemplate) return;
    try {
      setSaveLoading(true);
      await updateTemplate(editingTemplate.templateId, editingTemplate);
      toast.success("Template updated successfully");
      fetchTemplates();
      handleCloseEdit();
    } catch (error) {
      console.error("Failed to update template", error);
      toast.error("Failed to update template");
    } finally {
      setSaveLoading(false);
    }
  };

  const getPlaceholdersForTemplate = (templateId: string) => {
    if (templateId === "voyage-assignment") {
      return [
        "{RequestId}",
        "{VesselName}",
        "{OriginName}",
        "{DestinationName}",
        "{DepartureTime}",
        "{Urgency}",
      ];
    }
    if (templateId === "voyage-departure") {
      return [
        "{VoyageId}",
        "{VesselName}",
        "{OriginName}",
        "{DestinationName}",
        "{Eta}",
        "{ItemsTable}",
      ];
    }
    return [];
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      className="app-shell"
      sx={{
        height: "calc(100vh - 64px)",
        minHeight: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        p: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography
            variant="h5"
            fontWeight="600"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Mail size={24} color="var(--accent)" />
            Notification Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system-wide email subjects and HTML bodies
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Alert
            icon={<Info size={18} />}
            severity="info"
            sx={{
              bgcolor: "rgba(14, 165, 233, 0.1)",
              border: "1px solid rgba(14, 165, 233, 0.2)",
              color: "var(--text)",
              "& .MuiAlert-icon": { color: "#0ea5e9" },
              py: 0,
            }}
          >
            Templates use <strong>{`{Placeholder}`}</strong> syntax for dynamic
            data.
          </Alert>
        </Box>
      </Box>

      {/* Main Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          flex: 1,
          bgcolor: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflowY: "auto",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  bgcolor: "var(--panel-header)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Template Name
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel-header)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Subject Line
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel-header)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Description
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel-header)",
                  color: "var(--text-secondary)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                  width: 100,
                }}
                align="center"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow
                key={template.templateId}
                hover
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}
              >
                <TableCell
                  sx={{
                    color: "var(--text)",
                    fontWeight: 500,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: "8px",
                        bgcolor: "rgba(14, 165, 233, 0.1)",
                        color: "#0ea5e9",
                      }}
                    >
                      <Mail size={18} />
                    </Box>
                    {template.templateName}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                    fontStyle: "italic",
                  }}
                >
                  {template.subject}
                </TableCell>
                <TableCell
                  sx={{
                    color: "var(--text-secondary)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {template.description}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "1px solid var(--border)" }}
                  align="center"
                >
                  <Tooltip title="Edit Template">
                    <IconButton
                      onClick={() => handleEditClick(template)}
                      sx={{
                        color: "var(--accent)",
                        "&:hover": { bgcolor: "rgba(14, 165, 233, 0.1)" },
                      }}
                    >
                      <Edit size={18} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(editingTemplate)}
        onClose={handleCloseEdit}
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
        {editingTemplate && (
          <Box
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
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
                  {editingTemplate.templateName}
                </Typography>
              </Box>
              <IconButton
                onClick={handleCloseEdit}
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
                  value={editingTemplate.subject}
                  onChange={handleInputChange}
                  placeholder="Enter email subject"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": { bgcolor: "rgba(0,0,0,0.1)" },
                  }}
                />
              </Box>

              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "var(--text-secondary)" }}
                  >
                    HTML Body Content
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  name="bodyHtml"
                  value={editingTemplate.bodyHtml}
                  onChange={handleInputChange}
                  placeholder="Enter HTML template content"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "rgba(0,0,0,0.1)",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
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
                  {getPlaceholdersForTemplate(editingTemplate.templateId).map(
                    (p) => (
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
                    ),
                  )}
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
                onClick={handleCloseEdit}
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
                onClick={handleSave}
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
    </Box>
  );
};
