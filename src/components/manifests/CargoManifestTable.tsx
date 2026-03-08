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
  Button,
  TableSortLabel,
  Chip,
} from "@mui/material";
import { Download, Package, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import type { FlatCargoItem } from "../../types/maritime/logistics";
import { formatNumber } from "../../utils/formatters";

interface CargoManifestTableProps {
  sortedItems: FlatCargoItem[];
  orderBy: keyof FlatCargoItem;
  order: "asc" | "desc";
  handleRequestSort: (property: keyof FlatCargoItem) => void;
  exportToCSV: () => void;
}

export function CargoManifestTable({
  sortedItems,
  orderBy,
  order,
  handleRequestSort,
  exportToCSV,
}: CargoManifestTableProps) {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Button
          variant="contained"
          startIcon={<Download size={18} />}
          onClick={exportToCSV}
          className="btn-primary-gradient"
          sx={{ borderRadius: "8px", px: 3 }}
        >
          Export CSV
        </Button>
      </Box>

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
        <Table stickyHeader sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow>
              {[
                { id: "requestId", label: "Request" },
                { id: "requestDate", label: "Date" },
                { id: "businessUnitName", label: "Business Unit" },
                { id: "itemTypeName", label: "Item Name" },
                { id: "quantity", label: "Qty" },
                { id: "weight", label: "Weight (t)" },
                { id: "origin", label: "Origin" },
                { id: "destination", label: "Destination" },
                { id: "earliestDeparture", label: "Departure" },
                { id: "parentIsHazardous", label: "Hazardous" },
                { id: "urgency", label: "Urgency" },
                { id: "voyageStatus", label: "Delivery Status" },
              ].map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{
                    bgcolor: "var(--panel)",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={() =>
                      handleRequestSort(headCell.id as keyof FlatCargoItem)
                    }
                    sx={{
                      "&.MuiTableSortLabel-root": {
                        color: "var(--text)",
                      },
                      "&.MuiTableSortLabel-root:hover": {
                        color: "var(--text)",
                      },
                      "&.Mui-active": {
                        color: "var(--text)",
                      },
                      "& .MuiTableSortLabel-icon": {
                        color: "var(--text-secondary) !important",
                      },
                    }}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  sx={{ py: 10, textAlign: "center", borderBottom: "none" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      color: "var(--muted)",
                    }}
                  >
                    <Package size={48} opacity={0.3} />
                    <Typography>
                      No cargo items found matching the current filters.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              sortedItems.map((item, idx) => (
                <TableRow
                  key={`${item.requestId}-${item.itemId}-${idx}`}
                  sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.02)" } }}
                >
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 600,
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.requestId}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.requestDate
                      ? dayjs(item.requestDate).format("DD MMM YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.businessUnitName}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.itemTypeName || item.description || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {formatNumber(item.quantity)} {item.unitOfMeasurement}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {formatNumber(item.weight)}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.origin}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {item.destination}
                  </TableCell>
                  <TableCell
                    sx={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {dayjs(item.earliestDeparture).format("DD MMM HH:mm")}
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid var(--border)" }}>
                    {(item.isHazardous || item.parentIsHazardous) && (
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <AlertTriangle size={18} color="#f43f5e" />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid var(--border)" }}>
                    <Chip
                      label={item.urgency}
                      size="small"
                      sx={{
                        bgcolor: "rgba(56, 189, 248, 0.1)",
                        color: "var(--accent)",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ borderBottom: "1px solid var(--border)" }}>
                    {item.voyageStatus !== "-" && (
                      <Chip
                        label={item.voyageStatus}
                        size="small"
                        onClick={(e) => {
                          if (item.voyageStatus === "Enroute") {
                            e.stopPropagation();
                          }
                        }}
                        sx={{
                          bgcolor:
                            item.voyageStatus === "Enroute"
                              ? "rgba(56, 189, 248, 0.1)"
                              : "rgba(100, 116, 139, 0.1)",
                          color:
                            item.voyageStatus === "Enroute"
                              ? "var(--accent)"
                              : "var(--text-secondary)",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    )}
                    {item.voyageStatus === "-" && (
                      <span
                        style={{ color: "var(--muted)", fontSize: "0.85rem" }}
                      >
                        -
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
