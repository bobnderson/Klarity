import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem as MuiMenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Plus,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Box as BoxIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import type { PredefinedContainer } from "../../types/maritime/logistics";
import type { UnifiedVessel } from "../../types/maritime/marine";
import { containerService } from "../../services/maritime/containerService";
import { getVessels } from "../../services/maritime/vesselService";
import { LoadingIndicator } from "../common/LoadingIndicator";

export function PredefinedContainersView() {
  const [containers, setContainers] = useState<PredefinedContainer[]>([]);
  const [vessels, setVessels] = useState<UnifiedVessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContainer, setEditingContainer] =
    useState<Partial<PredefinedContainer> | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedContainer, setSelectedContainer] =
    useState<PredefinedContainer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [containerData, vesselData] = await Promise.all([
        containerService.getContainers(),
        getVessels(),
      ]);
      setContainers(containerData);
      setVessels(vesselData);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const loadContainers = async () => {
    try {
      setLoading(true);
      const data = await containerService.getContainers();
      setContainers(data);
    } catch (error) {
      console.error("Failed to load containers:", error);
      toast.error("Failed to load predefined containers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingContainer({
      name: "",
      vesselId: "",
      description: "",
      length: 0,
      width: 0,
      height: 0,
      dimensionUnit: "m",
      maxWeight: 0,
      weightUnit: "tonnes",
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (container: PredefinedContainer) => {
    setEditingContainer({ ...container });
    setDialogOpen(true);
  };

  const handleDelete = async (container: PredefinedContainer) => {
    if (
      window.confirm(
        `Are you sure you want to delete container "${container.name}"?`,
      )
    ) {
      try {
        await containerService.deleteContainer(container.containerId);
        toast.success("Container deleted successfully");
        loadContainers();
      } catch (error) {
        console.error("Failed to delete container:", error);
        toast.error("Failed to delete container");
      }
    }
  };

  const handleSave = async () => {
    if (
      !editingContainer?.name ||
      !editingContainer?.vesselId ||
      !editingContainer.length ||
      !editingContainer.width ||
      !editingContainer.height
    ) {
      toast.error("Please fill in all required fields (Name, dimensions)");
      return;
    }

    try {
      if (editingContainer.containerId) {
        await containerService.updateContainer(
          editingContainer.containerId,
          editingContainer as PredefinedContainer,
        );
        toast.success("Container updated successfully");
      } else {
        await containerService.createContainer(editingContainer);
        toast.success("Container created successfully");
      }
      setDialogOpen(false);
      loadContainers();
    } catch (error) {
      console.error("Failed to save container:", error);
      toast.error("Failed to save container");
    }
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    container: PredefinedContainer,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedContainer(container);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedContainer(null);
  };

  const filteredContainers = containers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) return <LoadingIndicator />;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}
    >
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
            <BoxIcon size={24} color="var(--accent)" />
            Predefined Containers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage standardized containers and their capacities for movement
            requests.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={handleCreate}
          sx={{
            bgcolor: "var(--accent)",
            fontWeight: 700,
            px: 3,
            borderRadius: "8px",
            "&:hover": { bgcolor: "var(--accent)", opacity: 0.9 },
          }}
        >
          New Container
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 1,
          p: 1.5,
          bgcolor: "var(--panel)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          alignItems: "center",
        }}
      >
        <TextField
          size="small"
          placeholder="Search containers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1.5 }}>
                <Search
                  size={18}
                  color="var(--accent)"
                  style={{ opacity: 0.8 }}
                />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          bgcolor: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          overflowY: "auto",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Name
              </TableCell>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Vessel
              </TableCell>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Description
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Dimensions (L×W×H)
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Volume
              </TableCell>
              <TableCell
                align="right"
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Max Capacity
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContainers.map((container) => (
              <TableRow
                key={container.containerId}
                hover
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell sx={{ fontWeight: 600, color: "var(--text)" }}>
                  {container.name}
                </TableCell>
                <TableCell sx={{ color: "var(--text)" }}>
                  {vessels.find(
                    (v) => (v as any).vesselId === container.vesselId,
                  )?.vesselName || "-"}
                </TableCell>
                <TableCell sx={{ color: "var(--text)" }}>
                  {container.description || "-"}
                </TableCell>
                <TableCell align="right" sx={{ color: "var(--text)" }}>
                  {container.length} × {container.width} × {container.height}{" "}
                  {container.dimensionUnit}
                </TableCell>
                <TableCell align="right" sx={{ color: "var(--text)" }}>
                  {(
                    container.length *
                    container.width *
                    container.height
                  ).toFixed(2)}{" "}
                  m³
                </TableCell>
                <TableCell align="right" sx={{ color: "var(--text)" }}>
                  {container.maxWeight} {container.weightUnit}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, container)}
                    sx={{ color: "var(--muted)" }}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredContainers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  align="center"
                  sx={{ py: 4, color: "var(--text-secondary)" }}
                >
                  No predefined containers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            bgcolor: "var(--panel)",
            border: "1px solid var(--border)",
            minWidth: 160,
          },
        }}
      >
        <MuiMenuItem
          onClick={() => {
            if (selectedContainer) handleEdit(selectedContainer);
            handleActionClose();
          }}
          sx={{ gap: 1.5, fontSize: "0.875rem" }}
        >
          <Edit2 size={16} color="var(--accent)" /> Edit Container
        </MuiMenuItem>
        <MuiMenuItem
          onClick={() => {
            if (selectedContainer) handleDelete(selectedContainer);
            handleActionClose();
          }}
          sx={{ gap: 1.5, fontSize: "0.875rem", color: "var(--danger)" }}
        >
          <Trash2 size={16} /> Delete
        </MuiMenuItem>
      </Menu>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "var(--panel)",
            backgroundImage: "none",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            color: "var(--text)",
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid var(--border)", pb: 2 }}>
          <Typography variant="h6" component="span" fontWeight="600">
            {editingContainer?.containerId
              ? "Edit Container"
              : "New Predefined Container"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {editingContainer && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gap: 2,
              }}
            >
              <Box sx={{ gridColumn: "span 12" }}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editingContainer.name || ""}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      name: e.target.value,
                    })
                  }
                  required
                  size="small"
                />
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <TextField
                  select
                  fullWidth
                  label="Vessel"
                  value={editingContainer.vesselId || ""}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      vesselId: e.target.value,
                    })
                  }
                  required
                  size="small"
                >
                  {vessels.map((v) => (
                    <MuiMenuItem
                      key={(v as any).vesselId}
                      value={(v as any).vesselId}
                    >
                      {v.vesselName}
                    </MuiMenuItem>
                  ))}
                </TextField>
              </Box>
              <Box sx={{ gridColumn: "span 12" }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editingContainer.description || ""}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      description: e.target.value,
                    })
                  }
                  size="small"
                  multiline
                  rows={2}
                />
              </Box>
              <Box sx={{ gridColumn: "span 4" }}>
                <TextField
                  fullWidth
                  label={`Length (${editingContainer.dimensionUnit})`}
                  type="number"
                  value={editingContainer.length || 0}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      length: Number(e.target.value),
                    })
                  }
                  required
                  size="small"
                />
              </Box>
              <Box sx={{ gridColumn: "span 4" }}>
                <TextField
                  fullWidth
                  label={`Width (${editingContainer.dimensionUnit})`}
                  type="number"
                  value={editingContainer.width || 0}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      width: Number(e.target.value),
                    })
                  }
                  required
                  size="small"
                />
              </Box>
              <Box sx={{ gridColumn: "span 4" }}>
                <TextField
                  fullWidth
                  label={`Height (${editingContainer.dimensionUnit})`}
                  type="number"
                  value={editingContainer.height || 0}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      height: Number(e.target.value),
                    })
                  }
                  required
                  size="small"
                />
              </Box>
              <Box sx={{ gridColumn: "span 6" }}>
                <TextField
                  fullWidth
                  label={`Max Weight Capacity (${editingContainer.weightUnit})`}
                  type="number"
                  value={editingContainer.maxWeight || 0}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      maxWeight: Number(e.target.value),
                    })
                  }
                  size="small"
                />
              </Box>
              <Box sx={{ gridColumn: "span 6" }}>
                <TextField
                  select
                  fullWidth
                  label="Weight Unit"
                  value={editingContainer.weightUnit || "tonnes"}
                  onChange={(e) =>
                    setEditingContainer({
                      ...editingContainer,
                      weightUnit: e.target.value,
                    })
                  }
                  size="small"
                >
                  <MuiMenuItem value="tonnes">Tonnes (MT)</MuiMenuItem>
                  <MuiMenuItem value="kg">Kilograms (kg)</MuiMenuItem>
                </TextField>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid var(--border)" }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ color: "var(--text-secondary)" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            sx={{
              bgcolor: "var(--accent)",
              color: "#000",
              fontWeight: 600,
              "&:hover": { bgcolor: "var(--accent-hover)" },
            }}
          >
            Save Container
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
