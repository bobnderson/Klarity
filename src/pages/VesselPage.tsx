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
  Chip,
  IconButton,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { LoadingIndicator } from "../components/common/LoadingIndicator";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Ship,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Settings,
  X,
} from "lucide-react";
import {
  InputAdornment,
  TextField,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import type { Vessel, VesselStatus } from "../types/maritime/marine";
import { VesselDesign } from "../components/maritime/VesselDesign";
import { VesselDeleteDialog } from "../components/maritime/VesselDeleteDialog";
import {
  createVessel,
  deleteVessel,
  getVessels,
  updateVessel,
} from "../services/maritime/vesselService";
import { getVesselStatuses } from "../services/maritime/referenceDataService";
import { formatNumber, formatCurrency } from "../utils/formatters";
import { getVesselStatusStyle } from "../utils/statusUtils";

export function VesselPage() {
  const [view, setView] = useState<"list" | "design">("list");
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [vesselStatuses, setVesselStatuses] = useState<VesselStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | undefined>(
    undefined,
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    vessel: Vessel | null;
  }>({ open: false, vessel: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vesselsData, statusesData] = await Promise.all([
          getVessels(),
          getVesselStatuses(),
        ]);
        setVessels(vesselsData);
        setVesselStatuses(statusesData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreate = () => {
    setEditingVessel(undefined);
    setView("design");
  };

  const handleEdit = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setView("design");
  };

  const handleSave = async (vessel: Vessel) => {
    setSaving(true);
    try {
      if (editingVessel) {
        // Update
        const updated = await updateVessel(vessel);
        setVessels((prev) =>
          prev.map((v) => (v.vesselId === updated.vesselId ? updated : v)),
        );
      } else {
        // Create
        const created = await createVessel(vessel);
        setVessels((prev) => [...prev, created]);
      }
      setView("list");
      toast.success(
        `Vessel ${editingVessel ? "updated" : "created"} successfully`,
      );
    } catch (error) {
      console.error("Failed to save vessel:", error);
      toast.error("Failed to save vessel");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (vessel: Vessel) => {
    setDeleteDialog({ open: true, vessel });
  };

  const handleConfirmDelete = async (reason: string) => {
    if (deleteDialog.vessel?.vesselId) {
      try {
        await deleteVessel(deleteDialog.vessel.vesselId, reason);
        setVessels((prev) =>
          prev.filter((v) => v.vesselId !== deleteDialog.vessel?.vesselId),
        );
        toast.success("Vessel deleted successfully");
      } catch (error) {
        console.error("Failed to delete vessel:", error);
        toast.error("Failed to delete vessel");
      } finally {
        setDeleteDialog({ open: false, vessel: null });
      }
    }
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    vessel: Vessel,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedVessel(vessel);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedVessel(null);
  };

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch = v.vesselName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || v.statusId === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
      {view === "list" ? (
        <>
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
                <Ship size={24} color="var(--accent)" />
                Vessel Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage fleet technical specifications and status.
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
              New Vessel
            </Button>
          </Box>

          {/* Search & Filter Bar */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              p: 1.5,
              bgcolor: "var(--panel)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              alignItems: "center",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "rgba(255, 178, 0, 0.3)",
              },
            }}
          >
            <TextField
              size="small"
              placeholder="Search vessel by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.02)",
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: "transparent" },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--accent)",
                    opacity: 0.5,
                  },
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
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery("")}
                      sx={{
                        color: "var(--muted)",
                        "&:hover": { color: "var(--danger)" },
                      }}
                    >
                      <X size={14} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                width: "1px",
                height: "24px",
                bgcolor: "var(--border)",
                mx: 1,
              }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                width: 180,
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.02)",
                  borderRadius: "8px",
                  "& fieldset": { borderColor: "transparent" },
                  "&:hover fieldset": { borderColor: "transparent" },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--accent)",
                    opacity: 0.5,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 1 }}>
                    <Filter
                      size={18}
                      color="var(--accent)"
                      style={{ opacity: 0.8 }}
                    />
                  </InputAdornment>
                ),
              }}
            >
              <MuiMenuItem value="All" sx={{ fontSize: "0.875rem" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2">All Statuses</Typography>
                </Box>
              </MuiMenuItem>
              {vesselStatuses.map((status) => {
                const style = getVesselStatusStyle(status.status);
                return (
                  <MuiMenuItem
                    key={status.statusId}
                    value={status.statusId}
                    sx={{ fontSize: "0.875rem" }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          w: 8,
                          h: 8,
                          borderRadius: "50%",
                          // Map MUI colors to hex for the dot
                          bgcolor:
                            style.color === "success"
                              ? "#10b981"
                              : style.color === "warning"
                                ? "#f59e0b"
                                : style.color === "error"
                                  ? "#ef4444"
                                  : style.color === "info"
                                    ? "#3b82f6"
                                    : "#6b7280",
                        }}
                      />
                      <Typography variant="body2">{status.status}</Typography>
                    </Box>
                  </MuiMenuItem>
                );
              })}
            </TextField>
          </Box>

          {loading && <LoadingIndicator />}

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
                    sx={{
                      color: "var(--text-secondary)",
                      fontWeight: 700,
                      py: 2,
                    }}
                  >
                    Name
                  </TableCell>
                  <TableCell
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Type
                  </TableCell>
                  <TableCell
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Owner
                  </TableCell>
                  <TableCell
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Hourly Cost
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    LOA (m)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    DWT (MT)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Complement
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
                {filteredVessels.map((vessel) => (
                  <TableRow
                    key={vessel.vesselId}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "var(--text)" }}>
                      {vessel.vesselName}
                    </TableCell>
                    <TableCell sx={{ color: "var(--text)" }}>
                      {vessel.vesselTypeName || vessel.vesselTypeId || "-"}
                    </TableCell>
                    <TableCell sx={{ color: "var(--text)" }}>
                      {vessel.owner || "-"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusObj = vesselStatuses.find(
                          (s) => s.statusId === vessel.statusId,
                        );
                        const statusName =
                          statusObj?.status || vessel.statusId || "Unknown";
                        const style = getVesselStatusStyle(statusName);
                        return (
                          <Chip
                            variant="outlined"
                            label={style.label}
                            size="small"
                            color={style.color as any}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.65rem",
                              height: 20,
                              px: 0.5,
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatCurrency(vessel.financials?.hourlyOperatingCost)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatNumber(vessel.particulars?.loa)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatNumber(vessel.capacities?.deadWeight)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatNumber(vessel.capacities?.totalComplement)}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, vessel)}
                        sx={{ color: "var(--muted)" }}
                      >
                        <MoreVertical size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <VesselDesign
          initialVessel={editingVessel}
          onSave={handleSave}
          onCancel={() => setView("list")}
          loading={saving}
        />
      )}

      <VesselDeleteDialog
        open={deleteDialog.open}
        vesselName={deleteDialog.vessel?.vesselName || ""}
        onClose={() => setDeleteDialog({ open: false, vessel: null })}
        onConfirm={handleConfirmDelete}
      />

      <Backdrop
        sx={{
          color: "var(--accent)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "rgba(0,0,0,0.7)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
        open={saving}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6" color="inherit" fontWeight="600">
          Saving Vessel...
        </Typography>
      </Backdrop>

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
            if (selectedVessel) handleEdit(selectedVessel);
            handleActionClose();
          }}
          sx={{ gap: 1.5, fontSize: "0.875rem" }}
        >
          <Edit2 size={16} color="var(--accent)" />
          Edit Vessel
        </MuiMenuItem>
        <MuiMenuItem
          onClick={handleActionClose}
          sx={{ gap: 1.5, fontSize: "0.875rem" }}
        >
          <Settings size={16} color="var(--text-secondary)" />
          Technical Specs
        </MuiMenuItem>
        <MuiMenuItem
          onClick={() => {
            if (selectedVessel) handleDeleteClick(selectedVessel);
            handleActionClose();
          }}
          sx={{ gap: 1.5, fontSize: "0.875rem", color: "var(--danger)" }}
        >
          <Trash2 size={16} />
          Delete
        </MuiMenuItem>
      </Menu>
    </Box>
  );
}
