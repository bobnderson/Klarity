import { useState } from "react";
import {
  Box,
  Typography,
  Popover,
  IconButton,
  Checkbox,
  FormControlLabel,
  Chip,
} from "@mui/material";
import { ChevronDown, X } from "lucide-react";
import type { Vessel } from "../../../types/maritime/marine";
import { getVessels } from "../../../services/maritime/vesselService";
import { toast } from "react-toastify";
import { useEffect } from "react";

const getStatusStyle = (status: string | undefined) => {
  switch (status) {
    case "Active":
      return { bgcolor: "rgba(34, 197, 94, 0.2)", color: "#4ade80" }; // Green
    case "Maintenance":
      return { bgcolor: "rgba(245, 158, 11, 0.2)", color: "#fbbf24" }; // Amber
    case "Inactive":
      return { bgcolor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }; // Red
    default:
      return { bgcolor: "rgba(148, 163, 184, 0.2)", color: "#94a3b8" }; // Grey
  }
};

interface HeaderVesselsProps {
  vessels?: Vessel[]; // Made optional as we fetch internally
  selectedVesselIds: string[];
  setSelectedVesselIds: (ids: string[]) => void;
}

export function HeaderVessels({
  vessels: propVessels = [],
  selectedVesselIds,
  setSelectedVesselIds,
}: HeaderVesselsProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [vessels, setVessels] = useState<Vessel[]>(propVessels);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const data = await getVessels();
        setVessels(data);
      } catch (error) {
        toast.error("Failed to fetch vessels: " + error);
      }
    };
    fetchVessels();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleVessel = (id: string) => {
    if (selectedVesselIds.includes(id)) {
      setSelectedVesselIds(selectedVesselIds.filter((vId) => vId !== id));
    } else {
      setSelectedVesselIds([...selectedVesselIds, id]);
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "vessels-popover" : undefined;

  const label =
    selectedVesselIds.length === vessels.length
      ? `All · ${vessels.length} Active`
      : `${selectedVesselIds.length} Selected`;

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
        <span className="chip-label">Vessels</span>
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
              minWidth: 240,
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              Select Vessels
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
              maxHeight: 300,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              pr: 1,
            }}
          >
            {vessels.map((vessel) => (
              <FormControlLabel
                key={vessel.vesselId}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedVesselIds.includes(vessel.vesselId || "")}
                    onChange={() => toggleVessel(vessel.vesselId || "")}
                    sx={{
                      color: "var(--text-secondary)",
                      "&.Mui-checked": { color: "var(--accent)" },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: 13, color: "var(--text)" }}>
                      {vessel.vesselName}
                    </Typography>
                    <Chip
                      label={vessel.statusId || "Unknown"}
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: 9,
                        ...getStatusStyle(vessel.statusId),
                      }}
                    />
                  </Box>
                }
                sx={{ ml: 0 }}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              mt: 1,
              pt: 1,
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
              }}
              onClick={() =>
                setSelectedVesselIds(vessels.map((v) => v.vesselId || ""))
              }
            >
              Select All
            </button>
            <button
              className="btn btn-ghost-custom"
              style={{
                flex: 1,
                fontSize: 11,
                padding: "6px 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setSelectedVesselIds([])}
            >
              Clear
            </button>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
