import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import { Ship, Plane, ChevronRight, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";
import type { MovementRequest } from "../../types/maritime/logistics";
import { getMovementRequestStatusStyle } from "../../utils/statusUtils";

interface ApprovalTableProps {
  requests: MovementRequest[];
  onRowClick: (request: MovementRequest) => void;
}

export function ApprovalTable({ requests, onRowClick }: ApprovalTableProps) {
  return (
    <Box
      sx={{
        p: 3,
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TableContainer
        component={Paper}
        sx={{
          flex: 1,
          bgcolor: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          boxShadow: "none",
          overflow: "auto",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
              <TableCell
                sx={{
                  bgcolor: "var(--panel)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Request ID
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Origin & Destination
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Date
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Urgency
              </TableCell>
              <TableCell
                sx={{
                  bgcolor: "var(--panel)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Status
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  bgcolor: "var(--panel)",
                  fontWeight: 700,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow
                key={request.requestId}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => onRowClick(request)}
              >
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {request.transportationMode === "Aviation" ||
                    request.requestId.startsWith("req-aviation") ? (
                      <Plane size={16} />
                    ) : (
                      <Ship size={16} />
                    )}
                    <Typography fontWeight={600}>
                      {request.requestId}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {request.originName} → {request.destinationName}
                  </Typography>
                </TableCell>
                <TableCell>
                  {dayjs(request.earliestDeparture).format("DD MMM YYYY")}
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.urgency || "Routine"}
                    size="small"
                    sx={{
                      bgcolor: request.urgencyId?.includes("urgent")
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(255, 255, 255, 0.05)",
                      color: request.urgencyId?.includes("urgent")
                        ? "#ef4444"
                        : "inherit",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={request.status}
                    size="small"
                    color={
                      getMovementRequestStatusStyle(request.status).color as any
                    }
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="text"
                    endIcon={<ChevronRight size={16} />}
                    sx={{ color: "var(--accent)" }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box
                    sx={{
                      opacity: 0.5,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <CheckCircle2 size={48} />
                    <Typography>
                      All caught up! No pending approvals.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
