import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Grid,
  Typography,
  Button,
  Paper,
  Divider,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import type {
  Helicopter,
  VesselStatus,
  VesselCategory,
} from "../../types/maritime/marine";
import { getVesselCategories } from "../../services/maritime/vesselService";
import { getVesselStatuses } from "../../services/maritime/referenceDataService";
import {
  Info,
  Gauge,
  User,
  Layout,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Waves,
} from "lucide-react";
import { formatNumber } from "../../utils/formatters";

interface HelicopterDesignProps {
  initialHelicopter?: Helicopter;
  onSave: (helicopter: Helicopter) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Reusable Numeric Input with Twin Label (Metric/Imperial)
 */
function TECH_SPEC_FIELD({
  label,
  value,
  onChange,
  unit,
  altLabel,
  altValue,
  altUnit,
  prefix = "",
}: {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
  unit: string;
  altLabel?: string;
  altValue?: number;
  altUnit?: string;
  prefix?: string;
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        label={label}
        type="number"
        size="small"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        slotProps={{
          input: {
            startAdornment: prefix ? (
              <InputAdornment position="start">{prefix}</InputAdornment>
            ) : undefined,
            endAdornment: (
              <InputAdornment position="end">{unit}</InputAdornment>
            ),
          },
        }}
        sx={{
          "& .MuiInputBase-root": { fontSize: "0.85rem" },
          "& .MuiInputLabel-root": { fontSize: "0.85rem" },
        }}
      />
      {altLabel && altValue !== undefined && (
        <Typography
          variant="caption"
          color="var(--text-secondary)"
          sx={{ ml: 1, mt: 0.5, display: "block" }}
        >
          {altLabel}: {formatNumber(altValue, 0)} {altUnit}
        </Typography>
      )}
    </Box>
  );
}

/**
 * 2D Seating Configuration Visualizer
 */
function HelicopterSeatMap({ passengerSeats }: { passengerSeats: number }) {
  // Seat 1 is in the cockpit (right side)
  // Remaining seats go into the cabin grid
  const totalPax = Math.max(0, passengerSeats);
  const cabinSeatsCount = Math.max(0, totalPax - 1);
  const cabinSeats = Array.from({ length: cabinSeatsCount });

  return (
    <Box
      sx={{
        mt: 3,
        p: 2.5,
        bgcolor: "rgba(0,0,0,0.2)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.3)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Layout size={14} color="var(--accent)" />
        <Typography
          variant="caption"
          sx={{
            color: "var(--muted)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1,
            fontSize: "0.65rem",
          }}
        >
          2D CABIN CONFIGURATION
        </Typography>
      </Box>

      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 380,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          // Add a subtle backdrop glow to the whole area
          "&::before": {
            content: '""',
            position: "absolute",
            width: "60%",
            height: "80%",
            bgcolor: "rgba(255,152,0,0.03)",
            filter: "blur(60px)",
            borderRadius: "50%",
          },
        }}
      >
        {/* Emergency Exit Arrows (Left) */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: "40%",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.6,
            }}
          >
            <ArrowLeft size={32} color="#ff3d00" strokeWidth={3} />
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 800,
                color: "#ff3d00",
                width: 40,
                lineHeight: 1,
              }}
            >
              EMERGENCY EXIT
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.6,
            }}
          >
            <ArrowLeft size={32} color="#ff3d00" strokeWidth={3} />
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 800,
                color: "#ff3d00",
                width: 40,
                lineHeight: 1,
              }}
            >
              EMERGENCY EXIT
            </Typography>
          </Box>
        </Box>

        {/* Emergency Exit Arrows (Right) */}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: "40%",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.6,
            }}
          >
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 800,
                color: "#ff3d00",
                width: 40,
                lineHeight: 1,
                textAlign: "right",
              }}
            >
              EMERGENCY EXIT
            </Typography>
            <ArrowRight size={32} color="#ff3d00" strokeWidth={3} />
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              opacity: 0.6,
            }}
          >
            <Typography
              sx={{
                fontSize: 9,
                fontWeight: 800,
                color: "#ff3d00",
                width: 40,
                lineHeight: 1,
                textAlign: "right",
              }}
            >
              EMERGENCY EXIT
            </Typography>
            <ArrowRight size={32} color="#ff3d00" strokeWidth={3} />
          </Box>
        </Box>

        {/* Helicopter Fuselage Outline */}
        <Box
          sx={{
            width: 200,
            height: 340,
            border: "3px solid rgba(255,255,255,0.15)",
            borderRadius: "100px 100px 30px 30px",
            position: "relative",
            // Use a darker "inner" background for the fuselage to ensure yellow/amber seats pop
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 2,
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.5)",
            zIndex: 2,
          }}
        >
          {/* Cockpit Area */}
          <Box
            sx={{
              width: "100%",
              height: 70,
              borderBottom: "1px dashed rgba(255,178,0,0.2)",
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 1.5,
            }}
          >
            {/* Pilot Seat - Fixed */}
            <Box
              sx={{
                width: 38,
                height: 38,
                bgcolor: "#2c2c2c",
                border: "2px solid #555",
                borderRadius: "8px 8px 12px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 900, color: "#fff" }}>
                P
              </Typography>
            </Box>

            {/* Fire Extinguisher Marker */}
            <Box
              sx={{
                position: "absolute",
                top: 50,
                right: 10,
                bgcolor: "#ff3d00",
                width: 14,
                height: 14,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <ShieldAlert size={10} color="#fff" />
            </Box>

            {/* Seat 1 - Cockpit Passenger */}
            {totalPax >= 1 ? (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: "rgba(255,152,0,0.25)",
                  border: "2px solid #ffa726",
                  borderRadius: "8px 8px 12px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 15px rgba(255,152,0,0.4)",
                  animation: "popIn 0.3s ease forwards",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#ffb74d",
                    textShadow: "0 0 5px rgba(0,0,0,0.5)",
                  }}
                >
                  1
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  border: "1px dashed rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.2,
                }}
              >
                <Typography sx={{ fontSize: 8 }}>Empty</Typography>
              </Box>
            )}
          </Box>

          {/* Cabin Area - Symmetrical Layout */}
          <Box
            sx={{
              width: "100%",
              flex: 1,
              display: "grid",
              // Use 2 columns for smaller counts (up to 5 pax total) to ensure symmetry
              gridTemplateColumns: `repeat(${cabinSeatsCount <= 4 ? 2 : 3}, 1fr)`,
              gap: 1.5,
              justifyItems: "center",
              alignContent: "start",
              px: 1,
              position: "relative",
            }}
          >
            {/* First Aid Kit Marker (Over Seat 6/7 area as in image) */}
            <Box
              sx={{
                position: "absolute",
                top: 90,
                right: 25,
                bgcolor: "#10b981",
                width: 14,
                height: 14,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5,
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              <Typography sx={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>
                +
              </Typography>
            </Box>

            {cabinSeats.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "rgba(255,152,0,0.15)",
                  border: "2px solid rgba(255,152,0,0.4)",
                  borderRadius: "8px 8px 12px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: `popIn 0.3s ease forwards`,
                  animationDelay: `${(i + 1) * 0.05}s`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.1)",
                    bgcolor: "rgba(255,152,0,0.25)",
                    borderColor: "#ffa726",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#ffa726",
                    textShadow: "0 0 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {i + 2}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Rear Compartment (If Installed) */}
          <Box
            sx={{
              width: "100%",
              height: 60,
              mt: 1,
              borderTop: "1px dashed rgba(255,178,0,0.3)",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
              p: 1,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                border: "1.5px solid rgba(255,178,0,0.4)",
                borderRadius: 1.5,
                bgcolor: "rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(255,178,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Waves size={18} color="#ffa726" />
              <Typography
                sx={{
                  fontSize: 7,
                  fontWeight: 800,
                  mt: 0.5,
                  color: "#ffa726",
                  letterSpacing: 0.5,
                }}
              >
                LIFE RAFT
              </Typography>
            </Box>
            <Box
              sx={{
                width: 48,
                height: 48,
                border: "1.5px solid rgba(255,61,0,0.4)",
                borderRadius: 1.5,
                bgcolor: "rgba(0,0,0,0.2)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(255,61,0,0.1)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#ff5252",
                  textShadow: "0 0 5px rgba(255,82,82,0.3)",
                }}
              >
                SOS
              </Typography>
              <Typography
                sx={{
                  fontSize: 7,
                  fontWeight: 800,
                  mt: 0,
                  color: "#ff5252",
                  letterSpacing: 0.5,
                }}
              >
                FLARE
              </Typography>
            </Box>
          </Box>

          {/* Tail Boom Indicator */}
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              width: 16,
              height: 30,
              bgcolor: "rgba(255,255,255,0.05)",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTop: 0,
              borderRadius: "0 0 8px 8px",
            }}
          />
        </Box>
      </Box>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 1,
          textAlign: "center",
          color: "var(--muted)",
          fontStyle: "italic",
        }}
      >
        * Safety equipment configuration shown for reference purposes.
      </Typography>
    </Box>
  );
}

export function HelicopterDesign({
  initialHelicopter,
  onSave,
  onCancel,
  loading = false,
}: HelicopterDesignProps) {
  const [formData, setFormData] = useState<Helicopter>({
    helicopterId: "",
    helicopterName: "",
    helicopterTypeId: "",
    statusId: "Active",
    cruiseAirspeedKts: 0,
    basicOperatingWeightLb: 0,
    maxGrossWeightLb: 0,
    availablePayloadLb: 0,
    maxFuelGal: 0,
    maxFuelLb: 0,
    enduranceHours: 0,
    rangeNm: 0,
    passengerSeats: 0,
    ...initialHelicopter,
  });

  const [categories, setCategories] = useState<VesselCategory[]>([]);
  const [vesselStatuses, setVesselStatuses] = useState<VesselStatus[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, statusesData] = await Promise.all([
          getVesselCategories(),
          getVesselStatuses(),
        ]);
        setCategories(categoriesData);
        setVesselStatuses(statusesData);
      } catch (error) {
        console.error("Failed to load helicopter form data:", error);
      }
    };
    loadData();
  }, []);

  const handleChange = (field: keyof Helicopter, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  // Converters
  const ktsToKmh = (kts: number) => kts * 1.852;
  const lbToKg = (lb: number) => lb * 0.453592;
  const galToL = (gal: number) => gal * 3.78541;
  const nmToKm = (nm: number) => nm * 1.852;

  return (
    <Box
      sx={{
        p: 3,
        height: "100%",
        overflowY: "auto",
        bgcolor: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5" fontWeight="700">
          {initialHelicopter ? "Edit Helicopter" : "New Helicopter Spec"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              loading || !formData.helicopterId || !formData.helicopterName
            }
            className="btn-primary-gradient"
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          >
            {loading ? "Saving..." : "Save Helicopter"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Basic Info */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            className="glass-panel"
            sx={{ p: 3, borderRadius: "16px", mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Info size={20} color="var(--accent)" />
              <Typography variant="subtitle1" fontWeight="700">
                GENERAL CONFIGURATION
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Tail Number (ID)"
              value={formData.helicopterId}
              onChange={(e) => handleChange("helicopterId", e.target.value)}
              size="small"
              sx={{ mb: 2 }}
              disabled={!!initialHelicopter}
            />
            <TextField
              fullWidth
              label="Helicopter Name"
              value={formData.helicopterName}
              onChange={(e) => handleChange("helicopterName", e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Owner"
              value={formData.owner || ""}
              onChange={(e) => handleChange("owner", e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.statusId || ""}
                  onChange={(e) => handleChange("statusId", e.target.value)}
                  size="small"
                >
                  {vesselStatuses.map((status) => (
                    <MenuItem key={status.statusId} value={status.statusId}>
                      {status.status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Model/Type"
                  value={formData.helicopterTypeId || ""}
                  onChange={(e) =>
                    handleChange("helicopterTypeId", e.target.value)
                  }
                  size="small"
                >
                  {categories
                    .find((c) => c.category === "Helicopter")
                    ?.types.map((t) => (
                      <MenuItem key={t.categoryTypeId} value={t.categoryTypeId}>
                        {t.categoryType}
                      </MenuItem>
                    )) || (
                    <MenuItem value="Helicopter">Standard Helicopter</MenuItem>
                  )}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper className="glass-panel" sx={{ p: 3, borderRadius: "16px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <User size={20} color="var(--accent)" />
              <Typography variant="subtitle1" fontWeight="700">
                CAPACITY
              </Typography>
            </Box>
            <TECH_SPEC_FIELD
              label="Number of Passenger Seats"
              value={formData.passengerSeats}
              onChange={(val) => handleChange("passengerSeats", val)}
              unit="Seats"
            />

            <HelicopterSeatMap passengerSeats={formData.passengerSeats || 0} />
          </Paper>
        </Grid>

        {/* Technical Specs */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper className="glass-panel" sx={{ p: 3, borderRadius: "16px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <Gauge size={20} color="var(--accent)" />
              <Typography variant="subtitle1" fontWeight="700">
                TECHNICAL SPECIFICATIONS
              </Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid size={{ xs: 6 }}>
                <TechSpecField
                  label="Cruise Airspeed"
                  value={Number(formData.cruiseAirspeedKts)}
                  onChange={(val) => handleChange("cruiseAirspeedKts", val)}
                  unit="kts"
                  altLabel="Static"
                  altValue={ktsToKmh(Number(formData.cruiseAirspeedKts))}
                  altUnit="km/hr"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TechSpecField
                  label="Endurance"
                  value={formData.enduranceHours}
                  onChange={(val) => handleChange("enduranceHours", val)}
                  unit="hrs"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 2, opacity: 0.1 }}>
                  <Typography variant="caption" color="var(--muted)">
                    WEIGHTS
                  </Typography>
                </Divider>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TechSpecField
                  label="Basic Operating Weight"
                  value={formData.basicOperatingWeightLb}
                  onChange={(val) =>
                    handleChange("basicOperatingWeightLb", val)
                  }
                  unit="lb"
                  altLabel="Converted"
                  altValue={lbToKg(Number(formData.basicOperatingWeightLb))}
                  altUnit="kg"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TechSpecField
                  label="Max Gross Weight"
                  value={formData.maxGrossWeightLb}
                  onChange={(val) => handleChange("maxGrossWeightLb", val)}
                  unit="lb"
                  altLabel="Converted"
                  altValue={lbToKg(Number(formData.maxGrossWeightLb))}
                  altUnit="kg"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TechSpecField
                  label="Available Payload (No Fuel)"
                  value={formData.availablePayloadLb}
                  onChange={(val) => handleChange("availablePayloadLb", val)}
                  unit="lb"
                  altLabel="Converted"
                  altValue={lbToKg(Number(formData.availablePayloadLb))}
                  altUnit="kg"
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 2, opacity: 0.1 }}>
                  <Typography variant="caption" color="var(--muted)">
                    FUEL & RANGE
                  </Typography>
                </Divider>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TechSpecField
                  label="Max Fuel (Vol)"
                  value={formData.maxFuelGal}
                  onChange={(val) => handleChange("maxFuelGal", val)}
                  unit="Gal"
                  altLabel="Converted"
                  altValue={galToL(Number(formData.maxFuelGal))}
                  altUnit="liters"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TechSpecField
                  label="Max Fuel (Weight)"
                  value={formData.maxFuelLb}
                  onChange={(val) => handleChange("maxFuelLb", val)}
                  unit="lb"
                  altLabel="Converted"
                  altValue={lbToKg(Number(formData.maxFuelLb))}
                  altUnit="kg"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TechSpecField
                  label="Range"
                  value={formData.rangeNm}
                  onChange={(val) => handleChange("rangeNm", val)}
                  unit="NM"
                  altLabel="Converted"
                  altValue={nmToKm(Number(formData.rangeNm))}
                  altUnit="km"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

// Rename TechSpecField to avoid case sensitivity issues with my new component
const TechSpecField = TECH_SPEC_FIELD;
