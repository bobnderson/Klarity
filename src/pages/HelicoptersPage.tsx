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
  Tooltip,
} from "@mui/material";
import { LoadingIndicator } from "../components/common/LoadingIndicator";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Settings,
  X,
  Plane,
  RefreshCw,
} from "lucide-react";
import {
  InputAdornment,
  TextField,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import type { Helicopter, VesselStatus } from "../types/maritime/marine";
import { HelicopterDesign } from "../components/maritime/HelicopterDesign";
import { VesselDeleteDialog } from "../components/maritime/VesselDeleteDialog";
import {
  createHelicopter,
  deleteHelicopter,
  getHelicopters,
  updateHelicopter,
} from "../services/maritime/helicopterService";
import { getVesselStatuses } from "../services/maritime/referenceDataService";
import { formatNumber } from "../utils/formatters";
import { getVesselStatusStyle } from "../utils/statusUtils";

export function HelicoptersPage() {
  const [view, setView] = useState<"list" | "design">("list");
  const [vessels, setVessels] = useState<Helicopter[]>([]);
  const [vesselStatuses, setVesselStatuses] = useState<VesselStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Helicopter | undefined>(
    undefined,
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    vessel: Helicopter | null;
  }>({ open: false, vessel: null });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVessel, setSelectedVessel] = useState<Helicopter | null>(null);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [vesselsData, statusesData] = await Promise.all([
        getHelicopters(),
        getVesselStatuses(),
      ]);
      setVessels(vesselsData);
      setVesselStatuses(statusesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingVessel(undefined);
    setView("design");
  };

  const handleEdit = (vessel: Helicopter) => {
    setEditingVessel(vessel);
    setView("design");
  };

  const handleSave = async (helicopter: Helicopter) => {
    setSaving(true);
    try {
      if (editingVessel) {
        // Update
        await updateHelicopter(helicopter.helicopterId, helicopter);
        setVessels((prev) =>
          prev.map((v) =>
            v.helicopterId === helicopter.helicopterId ? helicopter : v,
          ),
        );
      } else {
        // Create
        const created = await createHelicopter(helicopter);
        setVessels((prev) => [...prev, created]);
      }
      setView("list");
      toast.success(
        `Helicopter ${editingVessel ? "updated" : "created"} successfully`,
      );
    } catch (error) {
      console.error("Failed to save helicopter:", error);
      toast.error("Failed to save helicopter");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (vessel: Helicopter) => {
    setDeleteDialog({ open: true, vessel });
  };

  const handleConfirmDelete = async (_reason: string) => {
    if (deleteDialog.vessel?.helicopterId) {
      try {
        await deleteHelicopter(deleteDialog.vessel.helicopterId);
        setVessels((prev) =>
          prev.filter(
            (v) => v.helicopterId !== deleteDialog.vessel?.helicopterId,
          ),
        );
        toast.success("Helicopter deleted successfully");
      } catch (error) {
        console.error("Failed to delete helicopter:", error);
        toast.error("Failed to delete helicopter");
      } finally {
        setDeleteDialog({ open: false, vessel: null });
      }
    }
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    vessel: Helicopter,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedVessel(vessel);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedVessel(null);
  };

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch = v.helicopterName
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
                <Plane size={24} color="var(--accent)" />
                Helicopters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage aviation fleet technical specifications and status.
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
              New Helicopter
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
              placeholder="Search helicopter by name..."
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

            <Tooltip title="Refresh Data">
              <IconButton
                onClick={() => fetchData(true)}
                disabled={loading}
                sx={{
                  color: "var(--accent)",
                  bgcolor: "rgba(255, 178, 0, 0.05)",
                  "&:hover": {
                    bgcolor: "rgba(255, 178, 0, 0.1)",
                  },
                  ml: 1,
                  border: "1px solid rgba(255, 178, 0, 0.2)",
                  width: 40,
                  height: 40,
                }}
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
              </IconButton>
            </Tooltip>
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
                    Cruise Speed (kts)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Payload (lb)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Max Range (NM)
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Seats
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
                    key={vessel.helicopterId}
                    hover
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: "var(--text)" }}>
                      {vessel.helicopterName}
                    </TableCell>
                    <TableCell sx={{ color: "var(--text)" }}>
                      {vessel.helicopterTypeName ||
                        vessel.helicopterTypeId ||
                        "-"}
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
                      {formatNumber(vessel.cruiseAirspeedKts)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatNumber(vessel.availablePayloadLb)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatNumber(vessel.rangeNm)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: "var(--text)" }}>
                      {formatNumber(vessel.passengerSeats)}
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
        <HelicopterDesign
          initialHelicopter={editingVessel}
          onSave={handleSave}
          onCancel={() => setView("list")}
          loading={saving}
        />
      )}

      <VesselDeleteDialog
        open={deleteDialog.open}
        vesselName={deleteDialog.vessel?.helicopterName || ""}
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
          Saving Helicopter...
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
          Edit Helicopter
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
