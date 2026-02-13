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
  CircularProgress,
  Backdrop,
} from "@mui/material";
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
              mb: 1,
              p: 2,
              bgcolor: "var(--panel)",
              borderRadius: 2,
              border: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              placeholder="Search vessel by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flex: 1,
                "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.02)" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="var(--muted)" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                width: 160,
                "& .MuiInputBase-root": { bgcolor: "rgba(255,255,255,0.02)" },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Filter size={18} color="var(--muted)" />
                  </InputAdornment>
                ),
              }}
            >
              <MuiMenuItem value="All">All Statuses</MuiMenuItem>
              {vesselStatuses.map((status) => (
                <MuiMenuItem key={status.statusId} value={status.statusId}>
                  {status.status}
                </MuiMenuItem>
              ))}
            </TextField>
          </Box>

          {loading ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
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
          )}
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
