import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Backdrop,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import {
  Plus,
  ArrowRightLeft,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
} from "lucide-react";
import {
  InputAdornment,
  TextField,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import { MovementRequestForm } from "../components/maritime/logistics/MovementRequestForm";
import {
  getRequestsByAccountId,
  createRequest,
  updateRequest,
} from "../services/maritime/marineMovementService";
import type { User } from "../types/auth";
import type { MovementRequest } from "../types/maritime/logistics";
import dayjs from "dayjs";
import { getMovementRequestStatusStyle } from "../utils/statusUtils";

export function MovementReqPage() {
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingRequest, setEditingRequest] = useState<
    MovementRequest | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<MovementRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const user: User | null = JSON.parse(
    sessionStorage.getItem("user_data") || "null",
  );

  useEffect(() => {
    const fetchRequests = async () => {
      if (user?.accountId) {
        setLoading(true);
        try {
          const data = await getRequestsByAccountId(user.accountId);
          setRequests(data);
        } catch (error) {
          console.error("Failed to fetch requests", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchRequests();
  }, [user?.accountId]);

  const handleCreateNew = () => {
    setEditingRequest(undefined);
    setView("form");
  };

  const handleEdit = (request: MovementRequest) => {
    setEditingRequest(request);
    setView("form");
  };

  const handleSubmit = async (data: MovementRequest) => {
    setLoading(true);
    try {
      let updated: MovementRequest;
      if (editingRequest) {
        updated = await updateRequest(data.requestId, data);
        setRequests(
          requests.map((r) =>
            r.requestId === updated.requestId ? updated : r,
          ),
        );
      } else {
        updated = await createRequest({ ...data, status: "Pending" });
        setRequests([updated, ...requests]);
      }
      setView("list");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (data: MovementRequest) => {
    setLoading(true);
    try {
      let updated: MovementRequest;
      if (editingRequest) {
        updated = await updateRequest(data.requestId, {
          ...data,
          status: "Draft",
        });
        setRequests(
          requests.map((r) =>
            r.requestId === updated.requestId ? updated : r,
          ),
        );
      } else {
        updated = await createRequest({ ...data, status: "Draft" });
        setRequests([updated, ...requests]);
      }
      setView("list");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setView("list");
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    request: MovementRequest,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(request);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.requestId
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box
      sx={{
        p: view === "list" ? 4 : 0, // Adjust padding if needed for form view
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {loading && view === "list" && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            height: 3,
            bgcolor: "transparent",
            "& .MuiLinearProgress-bar": {
              bgcolor: "var(--accent)",
            },
          }}
        />
      )}
      {view === "form" ? (
        <MovementRequestForm
          initialData={editingRequest}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
          loading={loading}
        />
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                fontWeight="600"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ArrowRightLeft size={24} color="var(--accent)" />
                Marine Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage maritime Marine Requests and logistics
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={handleCreateNew}
              sx={{
                bgcolor: "var(--accent)",
                fontWeight: 700,
                px: 3,
                borderRadius: "8px",
                "&:hover": { bgcolor: "var(--accent)", opacity: 0.9 },
              }}
            >
              New Request
            </Button>
          </Box>

          {/* Search & Filter Bar */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              p: 2,
              bgcolor: "var(--panel)",
              borderRadius: 2,
              border: "1px solid var(--border)",
              alignItems: "center",
            }}
          >
            <TextField
              size="small"
              placeholder="Search by Request ID..."
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
              placeholder="Filter by Status"
              sx={{
                width: 150,
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
              <MuiMenuItem value="Draft">Draft</MuiMenuItem>
              <MuiMenuItem value="Pending">Pending</MuiMenuItem>
              <MuiMenuItem value="Approved">Approved</MuiMenuItem>
              <MuiMenuItem value="Rejected">Rejected</MuiMenuItem>
            </TextField>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              flex: 1,
              overflow: "auto",
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
                    Request ID
                  </TableCell>
                  <TableCell
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Route (Origin → Dest)
                  </TableCell>
                  <TableCell
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Planning Window
                  </TableCell>
                  <TableCell
                    sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
                  >
                    Status
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: "var(--text-secondary)",
                      fontWeight: 700,
                      pr: 4,
                    }}
                  >
                    Items Summary
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
                {filteredRequests.map((request) => {
                  const totalWeight = request.items.reduce(
                    (sum, item) => sum + (item.weight || 0),
                    0,
                  );
                  return (
                    <TableRow
                      key={request.requestId}
                      hover
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                      }}
                    >
                      <TableCell sx={{ color: "var(--text)", fontWeight: 600 }}>
                        {request.requestId}
                      </TableCell>
                      <TableCell sx={{ color: "var(--text)" }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {request.originName || request.originId}
                          </Typography>
                          <Typography variant="caption" color="var(--muted)">
                            →
                          </Typography>
                          <Typography variant="body2">
                            {request.destinationName || request.destinationId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            variant="caption"
                            display="block"
                            color="var(--text)"
                          >
                            Dep:{" "}
                            {dayjs(request.earliestDeparture).format(
                              "DD MMM · HH:mm",
                            )}
                          </Typography>
                          <Typography variant="caption" color="var(--muted)">
                            Arr:{" "}
                            {dayjs(request.latestArrival).format(
                              "DD MMM · HH:mm",
                            )}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            getMovementRequestStatusStyle(request.status).label
                          }
                          variant="outlined"
                          size="small"
                          color={
                            getMovementRequestStatusStyle(request.status)
                              .color as any
                          }
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.65rem",
                            height: 20,
                            px: 0.5,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 4 }}>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: "var(--text)", fontWeight: 600 }}
                          >
                            {totalWeight.toFixed(1)} t
                          </Typography>
                          <Typography variant="caption" color="var(--muted)">
                            {request.items.length} Item(s)
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionClick(e, request)}
                          sx={{ color: "var(--muted)" }}
                        >
                          <MoreVertical size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" variant="body2">
                        {searchQuery || statusFilter !== "All"
                          ? "No results matching your filters."
                          : "No Marine Requests found."}
                      </Typography>
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
                if (selectedRow) handleEdit(selectedRow);
                handleActionClose();
              }}
              sx={{ gap: 1.5, fontSize: "0.875rem" }}
            >
              <Edit2 size={16} color="var(--accent)" />
              Edit Request
            </MuiMenuItem>
            <MuiMenuItem
              onClick={handleActionClose}
              sx={{ gap: 1.5, fontSize: "0.875rem" }}
            >
              <Copy size={16} color="var(--text-secondary)" />
              Duplicate
            </MuiMenuItem>
            <MuiMenuItem
              onClick={handleActionClose}
              sx={{ gap: 1.5, fontSize: "0.875rem", color: "var(--danger)" }}
            >
              <Trash2 size={16} />
              Delete
            </MuiMenuItem>
          </Menu>
        </>
      )}

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 4000 }} // high z-index
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}
