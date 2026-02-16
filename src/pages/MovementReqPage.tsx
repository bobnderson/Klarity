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
  TablePagination,
} from "@mui/material";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  X,
} from "lucide-react";
import {
  InputAdornment,
  TextField,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import { LoadingIndicator } from "../components/common/LoadingIndicator";
import { MovementRequestForm } from "../components/maritime/logistics/MovementRequestForm";
import {
  getRequestsByAccountId,
  createRequest,
  updateRequest,
  deleteRequest,
} from "../services/maritime/marineMovementService";
import type { User } from "../types/auth";
import type { MovementRequest } from "../types/maritime/logistics";
import dayjs, { Dayjs } from "dayjs";
import { RequestsHeader } from "../components/maritime/RequestsHeader";
import {
  getMovementRequestStatusStyle,
  isMovementRequestStatusMatch,
} from "../utils/statusUtils";

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("isoWeek"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    dayjs().endOf("isoWeek"),
  );
  const [routeFilters, setRouteFilters] = useState<
    Array<{ origin: string | null; destination: string | null }>
  >([]);

  const handleApplyDateRange = () => {
    fetchRequests();
  };

  const user: User | null = JSON.parse(
    sessionStorage.getItem("user_data") || "null",
  );

  const fetchRequests = async () => {
    if (user?.accountId) {
      setLoading(true);
      try {
        const result = await getRequestsByAccountId(
          user.accountId,
          page + 1,
          rowsPerPage,
          "Marine",
          startDate?.toISOString(),
          endDate?.toISOString(),
        );
        setRequests(result.items || []);
        setTotalCount(result.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch requests", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.accountId, page, rowsPerPage]);

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

  const handleDelete = async (request: MovementRequest) => {
    if (
      !confirm(`Are you sure you want to delete request ${request.requestId}?`)
    )
      return;

    setLoading(true);
    try {
      if (request.requestId) {
        await deleteRequest(request.requestId);
        setRequests(requests.filter((r) => r.requestId !== request.requestId));
        setTotalCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Failed to delete request", error);
    } finally {
      setLoading(false);
      handleActionClose();
    }
  };

  const handleCancel = () => {
    setView("list");
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLElement>,
    row: MovementRequest,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRequests = (requests || []).filter((req) => {
    if (!req) return false;
    const matchesSearch = req.requestId
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = isMovementRequestStatusMatch(
      req.status,
      statusFilter,
    );

    // Route Filter
    const matchesRoute =
      routeFilters.length === 0 ||
      routeFilters.some((filter) => {
        const originMatch =
          !filter.origin ||
          req.originName === filter.origin ||
          req.originId === filter.origin;
        const destMatch =
          !filter.destination ||
          req.destinationName === filter.destination ||
          req.destinationId === filter.destination;
        return originMatch && destMatch;
      });

    return matchesSearch && matchesStatus && matchesRoute;
  });

  return (
    <Box
      sx={{
        p: 0,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {loading && view === "list" && <LoadingIndicator />}
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
          <RequestsHeader
            title="Marine Requests"
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            onApplyDateRange={handleApplyDateRange}
            routeFilters={routeFilters}
            setRouteFilters={setRouteFilters}
            onRefresh={fetchRequests}
            rightAction={
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
            }
          />

          <Box
            sx={{
              p: 1.25,
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              flex: 1,
              overflow: "hidden",
            }}
          >
            {/* Search & Filter Bar */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
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
                placeholder="Search by Request ID..."
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
                <MuiMenuItem value="Draft" sx={{ fontSize: "0.875rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        w: 8,
                        h: 8,
                        borderRadius: "50%",
                        bgcolor: "#3b82f6",
                      }}
                    />
                    <Typography variant="body2">Draft</Typography>
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem value="Pending" sx={{ fontSize: "0.875rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        w: 8,
                        h: 8,
                        borderRadius: "50%",
                        bgcolor: "#f59e0b",
                      }}
                    />
                    <Typography variant="body2">Pending / Submitted</Typography>
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem value="Approved" sx={{ fontSize: "0.875rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        w: 8,
                        h: 8,
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                      }}
                    />
                    <Typography variant="body2">Approved</Typography>
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem value="In-Transit" sx={{ fontSize: "0.875rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        w: 8,
                        h: 8,
                        borderRadius: "50%",
                        bgcolor: "#3b82f6",
                      }}
                    />
                    <Typography variant="body2">In-Transit</Typography>
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem value="Completed" sx={{ fontSize: "0.875rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        w: 8,
                        h: 8,
                        borderRadius: "50%",
                        bgcolor: "#10b981",
                      }}
                    />
                    <Typography variant="body2">Completed</Typography>
                  </Box>
                </MuiMenuItem>
                <MuiMenuItem value="Rejected" sx={{ fontSize: "0.875rem" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        w: 8,
                        h: 8,
                        borderRadius: "50%",
                        bgcolor: "#ef4444",
                      }}
                    />
                    <Typography variant="body2">
                      Rejected / Cancelled
                    </Typography>
                  </Box>
                </MuiMenuItem>
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
                    const totalWeight = (request.items || []).reduce(
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
                        <TableCell
                          sx={{ color: "var(--text)", fontWeight: 600 }}
                        >
                          {request.requestId}
                        </TableCell>
                        <TableCell sx={{ color: "var(--text)" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
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
                              getMovementRequestStatusStyle(request.status)
                                .label
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

            <TablePagination
              rowsPerPageOptions={[10, 20, 50]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                color: "var(--text-secondary)",
                bgcolor: "var(--panel)",
                borderTop: "1px solid var(--border)",
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
            />
          </Box>

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
              onClick={() => {
                if (selectedRow) handleDelete(selectedRow);
              }}
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
