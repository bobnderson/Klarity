import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Popover,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from "@mui/material";
import { ChevronDown, X, Plus, Trash2, ArrowRight } from "lucide-react";
import { getRoutes } from "../../../services/maritime/routeService";
import type { Route } from "../../../types/maritime/marine";
import { toast } from "react-toastify";

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Active":
      return { bgcolor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }; // Green
    case "Planned":
      return { bgcolor: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }; // Amber
    case "Inactive":
      return { bgcolor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }; // Red
    default:
      return { bgcolor: "rgba(148, 163, 184, 0.2)", color: "#94a3b8" }; // Grey
  }
};

interface HeaderRoutesProps {
  routeFilters: Array<{ origin: string | null; destination: string | null }>;
  setRouteFilters: (
    filters: Array<{ origin: string | null; destination: string | null }>,
  ) => void;
}

export function HeaderRoutes({
  routeFilters,
  setRouteFilters,
}: HeaderRoutesProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await getRoutes();
        setRoutes(data);
      } catch (error) {
        toast.error("Failed to fetch routes: " + error);
      }
    };
    fetchRoutes();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const addFilter = () => {
    setRouteFilters([...routeFilters, { origin: null, destination: null }]);
  };

  const removeFilter = (index: number) => {
    setRouteFilters(routeFilters.filter((_, i) => i !== index));
  };

  const updateFilter = (
    index: number,
    field: "origin" | "destination",
    value: string | null,
  ) => {
    const newFilters = [...routeFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setRouteFilters(newFilters);
  };

  const open = Boolean(anchorEl);
  const id = open ? "routes-popover" : undefined;

  const label =
    routeFilters.length === 0
      ? "All Routes"
      : `${routeFilters.length} Filter${routeFilters.length > 1 ? "s" : ""}`;

  return (
    <>
      <Box
        className="select-box"
        onClick={handleClick}
        sx={{
          cursor: "pointer",
          "&:hover": { bgcolor: "var(--accent-soft)" },
        }}
      >
        <span className="chip-label">Routes</span>
        <strong>{label}</strong>
        <ChevronDown size={14} />
      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: 2,
              boxShadow: "var(--shadow-soft)",
              backgroundImage: "none",
              minWidth: 320,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              Route Filters
            </Typography>
            <IconButton
              size="small"
              onClick={handleClose}
              sx={{ color: "var(--text-secondary)" }}
            >
              <X size={16} />
            </IconButton>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              maxHeight: 300,
              overflowY: "auto",
              pr: 0.5,
            }}
          >
            {routeFilters.map((filter, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  bgcolor: "var(--bg)",
                  borderRadius: 1,
                  border: "1px solid var(--border)",
                }}
              >
                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={filter.origin || "any"}
                    onChange={(e) =>
                      updateFilter(
                        index,
                        "origin",
                        e.target.value === "any" ? null : e.target.value,
                      )
                    }
                    sx={{
                      fontSize: 12,
                      color: "var(--text)",
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      bgcolor: "var(--panel)",
                    }}
                  >
                    <MenuItem value="any" sx={{ fontSize: 12 }}>
                      Any Origin
                    </MenuItem>
                    {routes.map((route) => (
                      <MenuItem
                        key={route.routeId}
                        value={route.route}
                        sx={{
                          fontSize: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <span>{route.route}</span>
                        <Chip
                          label={route.status}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 9,
                            ...getStatusStyle(route.status),
                          }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <ArrowRight size={14} color="#64748b" />

                <FormControl size="small" sx={{ flex: 1 }}>
                  <Select
                    value={filter.destination || "any"}
                    onChange={(e) =>
                      updateFilter(
                        index,
                        "destination",
                        e.target.value === "any" ? null : e.target.value,
                      )
                    }
                    sx={{
                      fontSize: 12,
                      color: "var(--text)",
                      ".MuiOutlinedInput-notchedOutline": { border: "none" },
                      bgcolor: "var(--panel)",
                    }}
                  >
                    <MenuItem value="any" sx={{ fontSize: 12 }}>
                      Any Destination
                    </MenuItem>
                    {routes.map((route) => (
                      <MenuItem
                        key={route.routeId}
                        value={route.route}
                        sx={{
                          fontSize: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <span>{route.route}</span>
                        <Chip
                          label={route.status}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: 9,
                            ...getStatusStyle(route.status),
                          }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <IconButton
                  size="small"
                  onClick={() => removeFilter(index)}
                  sx={{
                    color: "#ef4444",
                    "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" },
                  }}
                >
                  <Trash2 size={14} />
                </IconButton>
              </Box>
            ))}

            {routeFilters.length === 0 && (
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#64748b",
                  fontStyle: "italic",
                  textAlign: "center",
                  py: 1,
                }}
              >
                No filters active. Showing all voyages.
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 0.5,
              pt: 1.5,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              className="btn btn-ghost-custom"
              style={{
                flex: 1,
                fontSize: 11,
                padding: "6px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
              onClick={addFilter}
            >
              <Plus size={14} /> Add Route Filter
            </button>
            <button
              className="btn btn-ghost-custom"
              style={{
                fontSize: 11,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setRouteFilters([])}
            >
              Clear
            </button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
