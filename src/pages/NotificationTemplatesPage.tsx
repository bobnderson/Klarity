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
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Mail, Edit, Info } from "lucide-react";
import {
  TemplateEditorDrawer,
  beautifyHtml,
} from "../components/settings/TemplateEditorDrawer";
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
    setEditingTemplate({
      ...template,
      bodyHtml: beautifyHtml(template.bodyHtml),
    });
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
    if (templateId === "aviation-approval") {
      return [
        "{RequestId}",
        "{OriginName}",
        "{DestinationName}",
        "{RequestedBy}",
        "{DeepLink}",
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
      <PageHeader />

      <TemplatesTable templates={templates} onEdit={handleEditClick} />

      <TemplateEditorDrawer
        template={editingTemplate}
        open={Boolean(editingTemplate)}
        onClose={handleCloseEdit}
        onSave={handleSave}
        onInputChange={handleInputChange}
        saveLoading={saveLoading}
        getPlaceholders={getPlaceholdersForTemplate}
      />
    </Box>
  );
};

const PageHeader = () => (
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
);

interface TemplatesTableProps {
  templates: NotificationTemplate[];
  onEdit: (template: NotificationTemplate) => void;
}

const TemplatesTable = ({ templates, onEdit }: TemplatesTableProps) => (
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
                  onClick={() => onEdit(template)}
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
);
