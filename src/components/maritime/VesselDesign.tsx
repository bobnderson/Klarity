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
  Vessel,
  VesselCategory,
  VesselStatus,
} from "../../types/maritime/marine";
import { getVesselCategories } from "../../services/maritime/vesselService";
import { getVesselStatuses } from "../../services/maritime/referenceDataService";
import { VesselDeckVisualization } from "./VesselDeckVisualization";
import { Info, Ruler, Box as BoxIcon, Gauge, DollarSign } from "lucide-react";
import { formatNumber } from "../../utils/formatters";

interface VesselDesignProps {
  initialVessel?: Vessel;
  onSave: (vessel: Vessel) => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * A wrapper for TextField that handles numeric formatting (thousand separators).
 */
function NumericTextField({
  label,
  value,
  onChange,
  size = "small",
  sx,
  fullWidth = true,
  prefix = "",
  decimals = 0,
}: {
  label: string;
  value: number | string;
  onChange: (val: number) => void;
  size?: "small" | "medium";
  sx?: any;
  fullWidth?: boolean;
  prefix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Sync display value with incoming value prop
  useEffect(() => {
    if (!isFocused) {
      if (value === "" || value === undefined || value === null) {
        setDisplayValue("");
      } else {
        setDisplayValue(formatNumber(Number(value), decimals));
      }
    }
  }, [value, isFocused, decimals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, "");
    if (rawValue === "" || /^\d*\.?\d*$/.test(rawValue)) {
      setDisplayValue(e.target.value);
      if (rawValue !== "" && rawValue !== "." && !rawValue.endsWith(".")) {
        onChange(Number(rawValue));
      } else if (rawValue === "") {
        onChange(0);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (value !== undefined && value !== null) {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setDisplayValue(formatNumber(Number(value), decimals));
  };

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      value={displayValue}
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      size={size}
      sx={sx}
      slotProps={{
        input: {
          startAdornment: prefix ? (
            <InputAdornment position="start">{prefix}</InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}

export function VesselDesign({
  initialVessel,
  onSave,
  onCancel,
  loading = false,
}: VesselDesignProps) {
  // Initialize form state
  const [formData, setFormData] = useState<Partial<Vessel>>({
    vesselName: "",
    owner: "",
    vesselTypeId: "",
    vesselCategoryId: "",
    statusId: "Active",
    capacities: {
      fuelOil: 0,
      potableWater: 0,
      drillWater: 0,
      liquidMud: 0,
      dryBulkMud: 0,
      deadWeight: 0,
      deckArea: 0,
      deckLoading: 0,
    },
    particulars: {
      loa: 0,
      lwl: 0,
      breadthMoulded: 0,
      depthMainDeck: 0,
      designDraft: 0,
    },
    performance: {
      serviceSpeed: 0,
      maxSpeed: 0,
    },
    financials: {
      hourlyOperatingCost: 0,
      fuelConsumptionRate: 0,
      mobilisationCost: 0,
    },
    ...initialVessel,
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
        console.error("Failed to load vessel form data:", error);
      }
    };
    loadData();
  }, []);

  const handleChange = (field: string, value: any, section?: string) => {
    setFormData((prev) => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...(prev[section as keyof Vessel] as any),
            [field]: value,
          },
        };
      }

      // Filter filtering logic
      if (field === "vesselCategoryId") {
        return { ...prev, [field]: value, vesselTypeId: "" }; // Clear type on category change
      }

      return { ...prev, [field]: value };
    });
  };

  const fieldStyle = {
    "& .MuiInputBase-root": { fontSize: "0.85rem" },
    "& .MuiInputLabel-root": { fontSize: "0.85rem" },
  };

  const selectProps = {
    MenuProps: {
      sx: {
        "& .MuiMenuItem-root": {
          fontSize: "0.85rem",
        },
      },
    },
  };

  const handleSave = () => {
    // Basic validation could go here
    onSave(formData as Vessel);
  };

  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        overflow: "hidden",
        bgcolor: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="600">
          {initialVessel ? "Edit Vessel" : "New Vessel Design"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              borderColor: "var(--border)",
              color: "var(--text)",
              "&:hover": { borderColor: "var(--muted)" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            sx={{
              background:
                "linear-gradient(135deg, var(--accent), var(--success))",
              color: "var(--panel)",
              fontWeight: 700,
              fontSize: "12px",
              borderRadius: "999px",
              textTransform: "none",
              px: 3,
              boxShadow: "0 0 18px var(--accent-soft)",
              border: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, var(--accent), var(--success))",
                opacity: 0.9,
                boxShadow: "0 0 25px var(--accent-soft)",
              },
              "&.Mui-disabled": {
                background:
                  "linear-gradient(135deg, var(--accent), var(--success))",
                opacity: 0.5,
                boxShadow: "none",
                color: "var(--panel)",
              },
            }}
          >
            {loading ? "Saving..." : "Save Vessel"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ height: "calc(100% - 60px)" }}>
        {/* Form Section - Scrollable */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{ height: "100%", overflowY: "auto", pr: 1 }}
        >
          <Paper
            sx={{
              p: 2,
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            {/* General Info */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Info size={18} color="var(--accent)" />
              <Typography variant="subtitle2" color="primary">
                GENERAL INFORMATION
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Vessel Name"
                  value={formData.vesselName}
                  onChange={(e) => handleChange("vesselName", e.target.value)}
                  size="small"
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label="Owner"
                  value={formData.owner}
                  onChange={(e) => handleChange("owner", e.target.value)}
                  size="small"
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.statusId || ""}
                  onChange={(e) => handleChange("statusId", e.target.value)}
                  size="small"
                  sx={fieldStyle}
                  SelectProps={selectProps}
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
                  label="Vessel Category"
                  value={formData.vesselCategoryId || ""}
                  onChange={(e) =>
                    handleChange("vesselCategoryId", e.target.value)
                  }
                  size="small"
                  sx={fieldStyle}
                  SelectProps={selectProps}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.categoryId} value={cat.categoryId}>
                      {cat.category}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  select
                  label="Vessel Type"
                  value={formData.vesselTypeId || ""}
                  onChange={(e) => handleChange("vesselTypeId", e.target.value)}
                  size="small"
                  disabled={!formData.vesselCategoryId}
                  sx={fieldStyle}
                  SelectProps={selectProps}
                >
                  {categories
                    .find((c) => c.categoryId === formData.vesselCategoryId)
                    ?.types.map((t) => (
                      <MenuItem key={t.categoryTypeId} value={t.categoryTypeId}>
                        {t.categoryType}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3, borderColor: "var(--border)" }} />

            {/* Main Particulars */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Ruler size={18} color="var(--accent)" />
              <Typography variant="subtitle2" color="primary">
                MAIN PARTICULARS
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Length Overall (m)"
                  value={formData.particulars?.loa || ""}
                  onChange={(val) => handleChange("loa", val, "particulars")}
                  sx={fieldStyle}
                  decimals={2}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Length Waterline (m)"
                  value={formData.particulars?.lwl || ""}
                  onChange={(val) => handleChange("lwl", val, "particulars")}
                  sx={fieldStyle}
                  decimals={2}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Breadth (m)"
                  value={formData.particulars?.breadthMoulded || ""}
                  onChange={(val) =>
                    handleChange("breadthMoulded", val, "particulars")
                  }
                  sx={fieldStyle}
                  decimals={2}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Depth (m)"
                  value={formData.particulars?.depthMainDeck || ""}
                  onChange={(val) =>
                    handleChange("depthMainDeck", val, "particulars")
                  }
                  sx={fieldStyle}
                  decimals={2}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Draft (m)"
                  value={formData.particulars?.designDraft || ""}
                  onChange={(val) =>
                    handleChange("designDraft", val, "particulars")
                  }
                  sx={fieldStyle}
                  decimals={2}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3, borderColor: "var(--border)" }} />

            {/* Capacities */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <BoxIcon size={18} color="var(--accent)" />
              <Typography variant="subtitle2" color="primary">
                CAPACITIES
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Fuel Oil (m³)"
                  value={formData.capacities?.fuelOil || ""}
                  onChange={(val) => handleChange("fuelOil", val, "capacities")}
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Drill Water (m³)"
                  value={formData.capacities?.drillWater || ""}
                  onChange={(val) =>
                    handleChange("drillWater", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Potable Water (m³)"
                  value={formData.capacities?.potableWater || ""}
                  onChange={(val) =>
                    handleChange("potableWater", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Liquid Mud (m³)"
                  value={formData.capacities?.liquidMud || ""}
                  onChange={(val) =>
                    handleChange("liquidMud", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <NumericTextField
                  label="Dry Bulk Mud (m³)"
                  value={formData.capacities?.dryBulkMud || ""}
                  onChange={(val) =>
                    handleChange("dryBulkMud", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Deadweight (MT)"
                  value={formData.capacities?.deadWeight || ""}
                  onChange={(val) =>
                    handleChange("deadWeight", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Deck Area (m²)"
                  value={formData.capacities?.deckArea || ""}
                  onChange={(val) =>
                    handleChange("deckArea", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Deck Load (MT/m²)"
                  value={formData.capacities?.deckLoading || ""}
                  onChange={(val) =>
                    handleChange("deckLoading", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
              <Grid size={{ xs: 4 }}>
                <NumericTextField
                  label="Total Complement (pax)"
                  value={formData.capacities?.totalComplement || ""}
                  onChange={(val) =>
                    handleChange("totalComplement", val, "capacities")
                  }
                  sx={fieldStyle}
                />
              </Grid>
            </Grid>

            <Divider sx={{ mb: 3, borderColor: "var(--border)" }} />

            {/* Performance & Financials */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Gauge size={18} color="var(--accent)" />
                  <Typography variant="subtitle2" color="primary">
                    PERFORMANCE
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <NumericTextField
                    label="Service Speed (knots)"
                    value={formData.performance?.serviceSpeed || ""}
                    onChange={(val) =>
                      handleChange("serviceSpeed", val, "performance")
                    }
                    sx={fieldStyle}
                    decimals={1}
                  />
                  <NumericTextField
                    label="Max Speed (knots)"
                    value={formData.performance?.maxSpeed || ""}
                    onChange={(val) =>
                      handleChange("maxSpeed", val, "performance")
                    }
                    sx={fieldStyle}
                    decimals={1}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <DollarSign size={18} color="var(--accent)" />
                  <Typography variant="subtitle2" color="primary">
                    FINANCIALS
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <NumericTextField
                    label="Hourly Cost ($)"
                    value={formData.financials?.hourlyOperatingCost || ""}
                    onChange={(val) =>
                      handleChange("hourlyOperatingCost", val, "financials")
                    }
                    sx={fieldStyle}
                    prefix="$"
                    decimals={2}
                  />
                  <NumericTextField
                    label="Fuel Rate (L/hr)"
                    value={formData.financials?.fuelConsumptionRate || ""}
                    onChange={(val) =>
                      handleChange("fuelConsumptionRate", val, "financials")
                    }
                    sx={fieldStyle}
                    decimals={2}
                  />
                  <NumericTextField
                    label="Mobilisation Cost ($)"
                    value={formData.financials?.mobilisationCost || ""}
                    onChange={(val) =>
                      handleChange("mobilisationCost", val, "financials")
                    }
                    sx={fieldStyle}
                    prefix="$"
                    decimals={2}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Visualization Section */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "var(--muted)" }}>
            LIVE PREVIEW
          </Typography>
          <VesselDeckVisualization
            loa={formData.particulars?.loa || 0}
            breadth={formData.particulars?.breadthMoulded || 0}
            fuelOil={formData.capacities?.fuelOil}
            drillWater={formData.capacities?.drillWater}
            liquidMud={formData.capacities?.liquidMud}
            dryBulkMud={formData.capacities?.dryBulkMud}
            potableWater={formData.capacities?.potableWater}
            deckArea={formData.capacities?.deckArea}
            deckLoad={formData.capacities?.deckLoading}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
