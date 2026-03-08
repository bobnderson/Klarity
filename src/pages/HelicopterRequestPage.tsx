import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  Chip,
  Backdrop,
  CircularProgress,
  TablePagination,
  Grid,
} from "@mui/material";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Plane,
  Users as UsersIcon,
  Briefcase,
  Eye,
} from "lucide-react";
import {
  InputAdornment,
  TextField,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import { LoadingIndicator } from "../components/common/LoadingIndicator";
import { DeleteConfirmationDialog } from "../components/common/DeleteConfirmationDialog";
import { AviationRequestForm } from "../components/maritime/logistics/AviationRequestForm";
import { FlightRequestDrawer } from "../components/maritime/logistics/FlightRequestDrawer";
import { RequestsHeader } from "../components/maritime/RequestsHeader";
import {
  getRequestsByAccountId,
  createRequest,
  updateRequest,
  deleteRequest,
} from "../services/maritime/marineMovementService";
import type { User } from "../types/auth";
import type { MovementRequest } from "../types/maritime/logistics";
import dayjs, { Dayjs } from "dayjs";
import {
  getMovementRequestStatusStyle,
  isMovementRequestStatusMatch,
} from "../utils/statusUtils";
import { toast } from "react-toastify";

export function HelicopterRequestPage() {
  const [requests, setRequests] = useState<MovementRequest[]>([]);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingRequest, setEditingRequest] = useState<
    MovementRequest | undefined
  >(undefined);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<MovementRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MovementRequest | null>(
    null,
  );
  const [selectedDrawerRequest, setSelectedDrawerRequest] =
    useState<MovementRequest | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("isoWeek"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    dayjs().endOf("isoWeek"),
  );
  const [routeFilters, setRouteFilters] = useState<
    Array<{ origin: string | null; destination: string | null }>
  >([]);

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
          "Aviation",
          startDate?.toISOString(),
          endDate?.toISOString(),
        );
        setRequests(result.items || []);
        setTotalCount(result.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch requests", error);
        toast.error("Failed to load helicopter requests");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.accountId, page, rowsPerPage]);

  const handleApplyDateRange = () => {
    setPage(0);
    fetchRequests();
  };

  const handleCreateNew = () => {
    setEditingRequest({
      requestId: `AV-${Date.now()}`,
      requestDate: dayjs().toISOString(),
      status: "Draft",
      originId: "",
      destinationId: "",
      earliestDeparture: dayjs().toISOString(),
      latestDeparture: dayjs().add(2, "days").toISOString(),
      earliestArrival: dayjs().add(12, "hours").toISOString(),
      latestArrival: dayjs().add(3, "days").toISOString(),
      items: [],
      requestedBy: user?.accountId || "Unknown User",
      urgencyId: "routine-operations",
      scheduleIndicator: "Unscheduled",
      isHazardous: false,
      transportationRequired: false,
      tripType: "OneWay",
      lifting: "Normal",
      costCentre: "6",
      businessUnitId: "Aviation",
      notify: [],
    } as MovementRequest);
    setIsReadOnly(false);
    setView("form");
  };

  const handleEdit = (request: MovementRequest) => {
    setEditingRequest(request);
    setIsReadOnly(false);
    setView("form");
  };

  const handleView = (request: MovementRequest) => {
    setEditingRequest(request);
    setIsReadOnly(true);
    setView("form");
  };

  const handleSubmit = async (data: MovementRequest) => {
    setLoading(true);
    try {
      const aviationData = { ...data, costCentre: "6" };

      if (
        editingRequest?.requestId &&
        requests.some((r) => r.requestId === editingRequest.requestId)
      ) {
        await updateRequest(data.requestId, aviationData, "Aviation");
      } else {
        await createRequest({ ...aviationData, status: "Pending" }, "Aviation");
      }

      await fetchRequests();
      setView("list");
      toast.success("Request submitted successfully");
    } catch (error) {
      console.error("Failed to submit request", error);
      toast.error("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (data: MovementRequest) => {
    setLoading(true);
    try {
      const aviationData = {
        ...data,
        costCentre: "6",
        status: "Draft" as const,
      };

      if (
        editingRequest?.requestId &&
        requests.some((r) => r.requestId === editingRequest.requestId)
      ) {
        await updateRequest(data.requestId, aviationData, "Aviation");
      } else {
        await createRequest(aviationData, "Aviation");
      }

      await fetchRequests();
      setView("list");
      toast.success("Draft saved successfully");
    } catch (error) {
      console.error("Failed to save draft", error);
      toast.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (request: MovementRequest) => {
    setItemToDelete(request);
    setDeleteDialogOpen(true);
    handleActionClose();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete?.requestId) return;

    setLoading(true);
    try {
      await deleteRequest(itemToDelete.requestId, "Aviation");
      await fetchRequests();
      toast.success("Request deleted");
    } catch (error) {
      console.error("Failed to delete request", error);
      toast.error("Failed to delete request");
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
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

  const handleRequestClick = (request: MovementRequest) => {
    setSelectedDrawerRequest(request);
  };

  const handleDrawerClose = () => {
    setSelectedDrawerRequest(null);
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
        <AviationRequestForm
          initialData={editingRequest}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
          loading={loading}
          readOnly={isReadOnly}
        />
      ) : (
        <>
          <RequestsHeader
            title="Helicopter Requests"
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
            <HelicopterReqFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />

            <HelicopterReqGrid
              requests={filteredRequests}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onView={handleView}
              onEdit={handleEdit}
              onActionClick={handleActionClick}
              onRequestClick={handleRequestClick}
            />

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
                bgcolor: "transparent",
                mt: 2,
              }}
            />

            <HelicopterReqActionMenu
              anchorEl={anchorEl}
              selectedRow={selectedRow}
              onClose={handleActionClose}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />

            <DeleteConfirmationDialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
              onConfirm={handleConfirmDelete}
              title="Delete Request"
              description="Are you sure you want to delete this helicopter request? This action cannot be undone."
              itemName={itemToDelete?.requestId}
              isDeleting={loading}
            />
          </Box>
        </>
      )}

      <FlightRequestDrawer
        open={!!selectedDrawerRequest}
        onClose={handleDrawerClose}
        request={selectedDrawerRequest}
      />

      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 4000 }} // high z-index
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
}

// --- Sub-components ---

interface HelicopterReqFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

const HelicopterReqFilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: HelicopterReqFilterBarProps) => (
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
      onChange={(e) => onSearchChange(e.target.value)}
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
            <Search size={18} color="var(--accent)" style={{ opacity: 0.8 }} />
          </InputAdornment>
        ),
        endAdornment: searchQuery && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onSearchChange("")}
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
      onChange={(e) => onStatusChange(e.target.value)}
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
            <Filter size={18} color="var(--accent)" style={{ opacity: 0.8 }} />
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
              width: 8,
              height: 8,
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
              width: 8,
              height: 8,
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
              width: 8,
              height: 8,
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
              width: 8,
              height: 8,
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
              width: 8,
              height: 8,
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
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#ef4444",
            }}
          />
          <Typography variant="body2">Rejected / Cancelled</Typography>
        </Box>
      </MuiMenuItem>
    </TextField>
  </Box>
);

interface HelicopterReqGridProps {
  requests: MovementRequest[];
  searchQuery: string;
  statusFilter: string;
  onView: (request: MovementRequest) => void;
  onEdit: (request: MovementRequest) => void;
  onActionClick: (
    event: React.MouseEvent<HTMLElement>,
    row: MovementRequest,
  ) => void;
  onRequestClick: (request: MovementRequest) => void;
}

const HelicopterReqGrid = ({
  requests,
  searchQuery,
  statusFilter,
  onView,
  onEdit,
  onActionClick,
  onRequestClick,
}: HelicopterReqGridProps) => (
  <Box sx={{ flex: 1, overflow: "auto", px: 1 }}>
    {requests.length > 0 ? (
      <Grid container spacing={3}>
        {requests.map((request) => (
          <Grid size={{ xs: 12, lg: 6 }} key={request.requestId}>
            <HelicopterReqCard
              request={request}
              onView={onView}
              onEdit={onEdit}
              onActionClick={onActionClick}
              onRequestClick={onRequestClick}
            />
          </Grid>
        ))}
      </Grid>
    ) : (
      <Box
        sx={{
          p: 10,
          textAlign: "center",
          bgcolor: "var(--panel)",
          borderRadius: "16px",
          border: "1px dashed var(--border)",
        }}
      >
        <Typography color="text.secondary">
          {searchQuery || statusFilter !== "All"
            ? "No results matching your filters."
            : "No Aviation Requests found. Start by creating a new one."}
        </Typography>
      </Box>
    )}
  </Box>
);

interface HelicopterReqCardProps {
  request: MovementRequest;
  onView: (request: MovementRequest) => void;
  onEdit: (request: MovementRequest) => void;
  onActionClick: (
    event: React.MouseEvent<HTMLElement>,
    row: MovementRequest,
  ) => void;
  onRequestClick: (request: MovementRequest) => void;
}

const HelicopterReqCard = ({
  request,
  onView,
  onEdit,
  onActionClick,
  onRequestClick,
}: HelicopterReqCardProps) => {
  const totalWeight = (request.items || []).reduce(
    (sum, item) => sum + (item.weight || 0),
    0,
  );
  const paxCount = (request.items || [])
    .filter(
      (i) =>
        i.categoryId === "personnel" ||
        i.unitOfMeasurement?.toLowerCase() === "pax",
    )
    .reduce((s, i) => s + (i.quantity || 0), 0);
  const status = getMovementRequestStatusStyle(request.status);

  return (
    <Paper
      elevation={0}
      onClick={() => onRequestClick(request)}
      sx={{
        p: 0,
        borderRadius: "16px",
        bgcolor: "var(--panel)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "var(--accent-alpha)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Ticket Header */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px dashed var(--border)",
          position: "relative",
          "&::before, &::after": {
            content: '""',
            position: "absolute",
            bottom: -8,
            width: 16,
            height: 16,
            bgcolor: "var(--bg)",
            borderRadius: "50%",
            zIndex: 1,
          },
          "&::before": { left: -8 },
          "&::after": { right: -8 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              bgcolor: "var(--accent-alpha)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
            }}
          >
            <Plane size={18} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} lineHeight={1}>
              {request.requestId}
            </Typography>
            <Typography variant="caption" color="var(--text-secondary)">
              Flight Request
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {(request.tripType === "RoundTrip" ||
            request.returnScheduledDeparture ||
            request.returnVoyageId) && (
            <Chip
              label="Round Trip"
              variant="outlined"
              size="small"
              sx={{
                color: "var(--accent)",
                borderColor: "var(--accent-alpha)",
                height: 22,
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor: "var(--accent-alpha)",
              }}
            />
          )}
          <Chip
            label={status.label}
            size="small"
            sx={{
              bgcolor: `${status.color}.main`,
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 22,
              borderRadius: "6px",
            }}
          />
        </Box>
      </Box>

      {/* Ticket Body: Route */}
      <Box sx={{ p: 3, position: "relative" }}>
        {/* Outbound Leg */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb:
              request.tripType === "RoundTrip" ||
              request.returnScheduledDeparture ||
              request.returnVoyageId
                ? 3
                : 0,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="var(--text-secondary)"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              From
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {request.originName || request.originId || "TBD"}
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              {dayjs(
                request.scheduledDeparture || request.earliestDeparture,
              ).format("DD MMM · HH:mm")}
            </Typography>
          </Box>

          <Box
            sx={{
              flex: 0.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pt: 2,
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "2px",
                bgcolor: "var(--border)",
                position: "relative",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  bgcolor: "var(--panel)",
                  p: 0.5,
                }}
              >
                <Plane size={14} color="var(--accent)" />
              </Box>
            </Box>
            <Typography
              variant="caption"
              sx={{ mt: 1, color: "var(--text-secondary)" }}
            >
              {request.tripType === "RoundTrip" ||
              request.returnScheduledDeparture ||
              request.returnVoyageId
                ? "Outbound"
                : "Direct"}
            </Typography>
          </Box>

          <Box sx={{ flex: 1, textAlign: "right" }}>
            <Typography
              variant="caption"
              color="var(--text-secondary)"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              To
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              {request.destinationName || request.destinationId || "TBD"}
            </Typography>
            <Typography variant="body2" color="var(--text-secondary)">
              {dayjs(request.scheduledArrival || request.latestArrival).format(
                "DD MMM · HH:mm",
              )}
            </Typography>
          </Box>
        </Box>

        {/* Return Leg */}
        {(request.tripType === "RoundTrip" ||
          request.returnScheduledDeparture ||
          request.returnVoyageId) && (
          <>
            <Box
              sx={{
                my: 2,
                borderTop: "1px dashed var(--border)",
                opacity: 0.5,
              }}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  color="var(--text-secondary)"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Return From
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {request.destinationName || request.destinationId || "TBD"}
                </Typography>
                <Typography variant="body2" color="var(--text-secondary)">
                  {request.returnScheduledDeparture ||
                  request.returnEarliestDeparture
                    ? dayjs(
                        request.returnScheduledDeparture ||
                          request.returnEarliestDeparture,
                      ).format("DD MMM · HH:mm")
                    : "TBD"}
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 0.5,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pt: 2,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "2px",
                    bgcolor: "var(--border)",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%) rotate(180deg)",
                      bgcolor: "var(--panel)",
                      p: 0.5,
                    }}
                  >
                    <Plane size={14} color="var(--accent)" />
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    color: "var(--text-secondary)",
                  }}
                >
                  Return
                </Typography>
              </Box>

              <Box sx={{ flex: 1, textAlign: "right" }}>
                <Typography
                  variant="caption"
                  color="var(--text-secondary)"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Return To
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {request.originName || request.originId || "TBD"}
                </Typography>
                <Typography variant="body2" color="var(--text-secondary)">
                  {request.returnScheduledArrival || request.returnLatestArrival
                    ? dayjs(
                        request.returnScheduledArrival ||
                          request.returnLatestArrival,
                      ).format("DD MMM · HH:mm")
                    : "TBD"}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Summary Stats */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            mt: 2,
            pt: 2,
            borderTop: "1px solid var(--border)",
            opacity: 0.8,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <UsersIcon size={16} color="var(--accent)" />
            <Typography variant="body2" fontWeight={600}>
              {paxCount} pax
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Briefcase size={16} color="var(--success)" />
            <Typography variant="body2" fontWeight={600}>
              {(totalWeight * 1000).toFixed(0)} kg
            </Typography>
          </Box>
          <Box
            sx={{
              marginLeft: "auto",
              display: "flex",
              gap: 1,
            }}
          >
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onView(request);
              }}
              sx={{
                color: "var(--text-secondary)",
                bgcolor: "var(--panel-hover)",
                "&:hover": {
                  bgcolor: "var(--accent-alpha)",
                  color: "var(--accent)",
                },
              }}
            >
              <Eye size={16} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(request);
              }}
              sx={{
                color: "var(--accent)",
                bgcolor: "var(--accent-alpha)",
                "&:hover": {
                  bgcolor: "var(--accent)",
                  color: "#fff",
                },
              }}
            >
              <Edit2 size={16} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onActionClick(e, request);
              }}
              sx={{
                color: "var(--text-secondary)",
                bgcolor: "var(--panel-hover)",
              }}
            >
              <MoreVertical size={16} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

interface HelicopterReqActionMenuProps {
  anchorEl: HTMLElement | null;
  selectedRow: MovementRequest | null;
  onClose: () => void;
  onView: (request: MovementRequest) => void;
  onEdit: (request: MovementRequest) => void;
  onDelete: (request: MovementRequest) => void;
}

const HelicopterReqActionMenu = ({
  anchorEl,
  selectedRow,
  onClose,
  onView,
  onEdit,
  onDelete,
}: HelicopterReqActionMenuProps) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
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
        if (selectedRow) onView(selectedRow);
        onClose();
      }}
      sx={{ gap: 1.5, fontSize: "0.875rem" }}
    >
      <Eye size={16} color="var(--text-secondary)" />
      View Details
    </MuiMenuItem>
    <MuiMenuItem
      onClick={() => {
        if (selectedRow) onEdit(selectedRow);
        onClose();
      }}
      sx={{ gap: 1.5, fontSize: "0.875rem" }}
    >
      <Edit2 size={16} color="var(--accent)" />
      Edit Request
    </MuiMenuItem>
    <MuiMenuItem
      onClick={() => {
        if (selectedRow) onDelete(selectedRow);
        onClose();
      }}
      sx={{ gap: 1.5, fontSize: "0.875rem", color: "var(--danger)" }}
    >
      <Trash2 size={16} />
      Delete
    </MuiMenuItem>
  </Menu>
);
