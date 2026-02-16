import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  MenuItem,
  Typography,
  IconButton,
  Chip,
  LinearProgress,
} from "@mui/material";
import { useEffect } from "react";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Plus, Trash2, ClipboardList, Ship, Package } from "lucide-react";
import dayjs from "dayjs";
import { MOCK_AD_USERS } from "../../../data/maritime/masterData";
import type {
  MovementRequest,
  MovementRequestItem,
  UrgencyOption,
  UnitOfMeasurementOption,
  RequestTypeOption,
  BusinessUnitOption,
  ItemCategoryOption,
  ItemTypeOption,
} from "../../../types/maritime/logistics";
import type { Route } from "../../../types/maritime/marine";
import { getRoutes } from "../../../services/maritime/routeService";
import {
  getVolumeUnits,
  getWeightUnits,
  getUrgencyOptions,
  getRequestTypes,
  getBusinessUnits,
  getItemCategories,
  getItemTypes,
  getUnits,
} from "../../../services/maritime/referenceDataService";

import type { User } from "../../../types/auth";

interface MovementRequestFormProps {
  initialData?: MovementRequest;
  onSubmit: (data: MovementRequest) => void;
  onSaveDraft: (data: MovementRequest) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function MovementRequestForm({
  initialData,
  onSubmit,
  onSaveDraft,
  onCancel,
  loading = false,
}: MovementRequestFormProps) {
  const user: User | null = JSON.parse(
    sessionStorage.getItem("user_data") || "null",
  );

  const [formData, setFormData] = useState<MovementRequest>(
    initialData
      ? { ...initialData }
      : {
          requestId: `MR-${Date.now()}`,
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
          lifting: "Normal",
          notify: [],
        },
  );

  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [dimensionUnits, setDimensionUnits] = useState<string[]>([]);
  const [weightUnits, setWeightUnits] = useState<string[]>([]);
  const [urgencyOptions, setUrgencyOptions] = useState<UrgencyOption[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategoryOption[]>(
    [],
  );
  const [itemTypes, setItemTypes] = useState<ItemTypeOption[]>([]);
  const [uomUnits, setUomUnits] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        const [
          routes,
          dims,
          weights,
          urgencies,
          types,
          bus,
          categories,
          iTypes,
          uoms,
        ] = await Promise.all([
          getRoutes(),
          getVolumeUnits(),
          getWeightUnits(),
          getUrgencyOptions(),
          getRequestTypes(),
          getBusinessUnits(),
          getItemCategories(),
          getItemTypes(),
          getUnits(),
        ]);
        setAvailableRoutes(routes);
        setDimensionUnits(dims);
        setWeightUnits(weights);
        setUrgencyOptions(urgencies);
        setRequestTypes(types);
        setBusinessUnits(bus);
        setItemCategories(categories);
        setItemTypes(iTypes);
        setUomUnits(
          (uoms || []).map((u: UnitOfMeasurementOption) => u.unitLabel),
        );
      } catch (error) {
        console.error("Failed to load reference data", error);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  const handleFormUpdate = (field: keyof MovementRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    const newItem: MovementRequestItem = {
      itemId: `ITEM-${Date.now()}`,
      categoryId: "cargo",
      itemTypeId: "",
      quantity: 0,
      unitOfMeasurement: "",
      description: "",
      dimensions: "",
      dimensionUnit: "m3",
      volume: 0,
      weight: 0,
      weightUnit: "tonnes",
      isHazardous: false,
    };
    handleFormUpdate("items", [...(formData.items || []), newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...(formData.items || [])];
    newItems.splice(index, 1);
    handleFormUpdate("items", newItems);
  };

  const handleItemChange = (
    index: number,
    field: keyof MovementRequestItem,
    value: any,
  ) => {
    const newItems = [...(formData.items || [])];
    if (field === "categoryId" && value !== newItems[index].categoryId) {
      newItems[index] = { ...newItems[index], [field]: value, itemTypeId: "" };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    handleFormUpdate("items", newItems);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const newItems: MovementRequestItem[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes("consignment")) return;
        if (!line.trim()) return;

        const [
          consignmentTypeLabel,
          itemTypeLabel,
          quantity,
          unitOfMeasurement,
          description,
          dimensions,
          weight,
        ] = line.split(",").map((s) => s.trim());

        // Find categoryId from label
        const consignmentType = itemCategories.find(
          (ct) =>
            ct.categoryName.toLowerCase() ===
            consignmentTypeLabel.toLowerCase(),
        );

        if (consignmentType) {
          // Find itemTypeId from label
          const itemType = itemTypes
            .filter((it) => it.categoryId === consignmentType.categoryId)
            .find(
              (it) => it.typeName.toLowerCase() === itemTypeLabel.toLowerCase(),
            );

          newItems.push({
            itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            categoryId: consignmentType.categoryId,
            itemTypeId: itemType?.typeId || "",
            quantity: Number(quantity) || 0,
            unitOfMeasurement: unitOfMeasurement || "",
            description: description || "",
            dimensions: dimensions || "",
            weight: Number(weight) || 0,
          });
        }
      });

      if (newItems.length > 0) {
        handleFormUpdate("items", [...(formData.items || []), ...newItems]);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleSubmit = () => {
    if (!formData.originId || !formData.destinationId) return;
    onSubmit(formData);
  };

  const handleSaveDraft = () => {
    if (!formData.originId || !formData.destinationId) return;
    onSaveDraft(formData);
  };

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "var(--bg)",
        minHeight: "100%",
        color: "var(--text)",
        position: "relative",
      }}
    >
      {dataLoading && (
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5" fontWeight="600">
          {initialData ? "Edit Marine Request" : "New Marine Request"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={onCancel} variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => handleSaveDraft()}
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: "var(--accent)",
              color: "var(--panel)",
              fontWeight: 700,
              fontSize: "12px",
              borderRadius: "999px",
              textTransform: "none",
              px: 3,
              "&:hover": {
                bgcolor: "var(--accent)",
                opacity: 0.9,
              },
              "&.Mui-disabled": {
                bgcolor: "var(--accent)",
                opacity: 0.5,
                color: "var(--panel)",
              },
            }}
          >
            {loading ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit()}
            variant="contained"
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
              },
            }}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* REQUEST DETAILS */}
        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              p: 3,
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <Box
              sx={{
                mb: 3,
                pb: 1,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  variant="subtitle1"
                  color="primary"
                  fontWeight={600}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: "0.95rem",
                  }}
                >
                  <ClipboardList size={20} />
                  REQUEST DETAILS
                </Typography>
                {formData.requestId && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--muted)",
                      fontWeight: 700,
                      opacity: 0.8,
                    }}
                  >
                    REF: {formData.requestId}
                  </Typography>
                )}
              </Box>
            </Box>

            <Grid container spacing={2}>
              {/* Request Type */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Request Type"
                  value={formData.requestTypeId || ""}
                  onChange={(e) =>
                    handleFormUpdate("requestTypeId", e.target.value)
                  }
                  size="small"
                  className="compact-form-field"
                >
                  {(requestTypes || []).map((type) => (
                    <MenuItem
                      key={type.requestTypeId}
                      value={type.requestTypeId}
                      className="compact-menu-item"
                    >
                      {type.requestType}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Priority */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Priority"
                  value={formData.urgencyId || "routine-operations"}
                  onChange={(e) =>
                    handleFormUpdate("urgencyId", e.target.value)
                  }
                  size="small"
                  className="compact-form-field"
                >
                  {(urgencyOptions || []).map((u) => (
                    <MenuItem
                      key={u.urgencyId}
                      value={u.urgencyId}
                      className="compact-menu-item"
                    >
                      {u.urgencyLabel}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Lifting */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Lifting"
                  value={formData.lifting || "Normal"}
                  onChange={(e) => handleFormUpdate("lifting", e.target.value)}
                  size="small"
                  className="compact-form-field"
                >
                  <MenuItem value="Normal" className="compact-menu-item">
                    Normal
                  </MenuItem>
                  <MenuItem value="Complex" className="compact-menu-item">
                    Complex
                  </MenuItem>
                </TextField>
              </Grid>
              {/* Transportation Required */}
              <Grid
                size={{ xs: 12, md: 3 }}
                sx={{ display: "flex", alignItems: "center" }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={formData.transportationRequired || false}
                      onChange={(e) =>
                        handleFormUpdate(
                          "transportationRequired",
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label={
                    <Typography
                      className="compact-form-field"
                      sx={{ fontSize: "12px" }}
                    >
                      Transportation Required?
                    </Typography>
                  }
                />
              </Grid>

              {/* Business Unit */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Business Unit"
                  value={formData.businessUnitId || ""}
                  onChange={(e) => {
                    handleFormUpdate("businessUnitId", e.target.value);
                    handleFormUpdate("costCentre", "");
                  }}
                  size="small"
                  className="compact-form-field"
                >
                  {(businessUnits || []).map((bu) => (
                    <MenuItem
                      key={bu.businessUnitId}
                      value={bu.businessUnitId}
                      className="compact-menu-item"
                    >
                      {bu.businessUnit}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              {/* Cost Centre */}
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Cost Centre/WBSE"
                  value={formData.costCentre || ""}
                  onChange={(e) =>
                    handleFormUpdate("costCentre", e.target.value)
                  }
                  size="small"
                  disabled={!formData.businessUnitId}
                  className="compact-form-field"
                >
                  {businessUnits
                    .find((b) => b.businessUnitId === formData.businessUnitId)
                    ?.costCentres?.map((cc) => (
                      <MenuItem
                        key={cc.code}
                        value={cc.code}
                        className="compact-menu-item"
                      >
                        {cc.code} - {cc.name}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>

              {/* Notify */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  options={MOCK_AD_USERS}
                  getOptionLabel={(option) => option.displayName}
                  value={MOCK_AD_USERS.filter((u) =>
                    (formData.notify || []).includes(u.id),
                  )}
                  onChange={(_, newValue) => {
                    handleFormUpdate(
                      "notify",
                      newValue.map((u) => u.id),
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Notify"
                      placeholder="Select users..."
                      size="small"
                      className="compact-form-field"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.displayName}
                          size="small"
                          {...tagProps}
                          sx={{ fontSize: "0.75rem", height: 24 }}
                        />
                      );
                    })
                  }
                  ListboxProps={{
                    className: "compact-menu-item",
                  }}
                />
              </Grid>

              {/* Comments */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Comments"
                  multiline
                  rows={2}
                  value={formData.comments || ""}
                  onChange={(e) => handleFormUpdate("comments", e.target.value)}
                  size="small"
                  className="compact-form-field"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              p: 3,
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <Box
              sx={{
                mb: 3,
                pb: 1,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <Typography
                variant="subtitle1"
                color="primary"
                fontWeight={600}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: "0.95rem",
                }}
              >
                <Ship size={20} />
                VOYAGE DETAILS
              </Typography>
            </Box>

            <Grid container spacing={2} alignItems="center">
              {/* Origin */}
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Origin"
                  value={formData.originId || ""}
                  onChange={(e) => handleFormUpdate("originId", e.target.value)}
                  size="small"
                  className="compact-form-field"
                >
                  {(availableRoutes || []).map((route) => (
                    <MenuItem
                      key={route.routeId}
                      value={route.routeId}
                      className="compact-menu-item"
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Typography variant="inherit">{route.route}</Typography>
                        <Chip
                          label={route.status}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 18,
                            fontSize: "0.625rem",
                            borderColor:
                              route.status === "Active"
                                ? "var(--success)"
                                : "var(--text-secondary)",
                            color:
                              route.status === "Active"
                                ? "var(--success)"
                                : "var(--text-secondary)",
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Destination */}
              <Grid size={{ xs: 12, md: 2 }}>
                <TextField
                  select
                  fullWidth
                  label="Destination"
                  value={formData.destinationId || ""}
                  onChange={(e) =>
                    handleFormUpdate("destinationId", e.target.value)
                  }
                  size="small"
                  className="compact-form-field"
                >
                  {(availableRoutes || []).map((route) => (
                    <MenuItem
                      key={route.routeId}
                      value={route.routeId}
                      className="compact-menu-item"
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Typography variant="inherit">{route.route}</Typography>
                        <Chip
                          label={route.status}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 18,
                            fontSize: "0.625rem",
                            borderColor:
                              route.status === "Active"
                                ? "var(--success)"
                                : "var(--text-secondary)",
                            color:
                              route.status === "Active"
                                ? "var(--success)"
                                : "var(--text-secondary)",
                          }}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Earliest Departure */}
              <Grid size={{ xs: 12, md: 2 }}>
                <DateTimePicker
                  label="Earliest Departure"
                  value={
                    formData.earliestDeparture
                      ? dayjs(formData.earliestDeparture)
                      : null
                  }
                  onChange={(newValue) =>
                    handleFormUpdate(
                      "earliestDeparture",
                      newValue?.toISOString() || "",
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "compact-form-field",
                    },
                  }}
                />
              </Grid>

              {/* Latest Departure */}
              <Grid size={{ xs: 12, md: 2 }}>
                <DateTimePicker
                  label="Latest Departure"
                  value={
                    formData.latestDeparture
                      ? dayjs(formData.latestDeparture)
                      : null
                  }
                  onChange={(newValue) =>
                    handleFormUpdate(
                      "latestDeparture",
                      newValue?.toISOString() || "",
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "compact-form-field",
                    },
                  }}
                />
              </Grid>

              {/* Earliest Arrival */}
              <Grid size={{ xs: 12, md: 2 }}>
                <DateTimePicker
                  label="Earliest Arrival"
                  value={
                    formData.earliestArrival
                      ? dayjs(formData.earliestArrival)
                      : null
                  }
                  onChange={(newValue) =>
                    handleFormUpdate(
                      "earliestArrival",
                      newValue?.toISOString() || "",
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "compact-form-field",
                    },
                  }}
                />
              </Grid>

              {/* Latest Arrival */}
              <Grid size={{ xs: 12, md: 2 }}>
                <DateTimePicker
                  label="Latest Arrival"
                  value={
                    formData.latestArrival
                      ? dayjs(formData.latestArrival)
                      : null
                  }
                  onChange={(newValue) =>
                    handleFormUpdate(
                      "latestArrival",
                      newValue?.toISOString() || "",
                    )
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "compact-form-field",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Bottom Section: Items */}
        <Grid size={{ xs: 12 }}>
          <Paper
            sx={{
              p: 3,
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-soft)",
              minHeight: "400px",
            }}
          >
            <Box
              sx={{
                mb: 3,
                pb: 1,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                variant="subtitle1"
                color="primary"
                fontWeight={600}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: "0.95rem",
                }}
              >
                <Package size={20} />
                ITEMS MANIFEST
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  {(formData.items || []).length} items
                </Typography>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  sx={{ borderColor: "var(--border)", color: "var(--text)" }}
                >
                  Bulk Upload (CSV)
                  <input
                    type="file"
                    hidden
                    accept=".csv"
                    onChange={handleBulkUpload}
                  />
                </Button>
                <Button
                  startIcon={<Plus size={16} />}
                  onClick={handleAddItem}
                  variant="outlined"
                  size="small"
                  sx={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                >
                  Add Item
                </Button>
              </Box>
            </Box>

            {(formData.items || []).map((item, index) => (
              <Paper
                key={item.itemId}
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  bgcolor: item.isHazardous
                    ? "rgba(239, 68, 68, 0.04)"
                    : "var(--bg)",
                  borderColor: item.isHazardous
                    ? "var(--danger)"
                    : "var(--border)",
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: item.isHazardous
                      ? "rgba(239, 68, 68, 0.08)"
                      : "var(--accent-soft)",
                    borderColor: item.isHazardous
                      ? "var(--danger)"
                      : "var(--accent)",
                  },
                }}
              >
                <Grid container spacing={1} alignItems="flex-start">
                  <Grid
                    size={{ xs: 4, md: 1.5 }}
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      pt: 0.1,
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.isHazardous || false}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "isHazardous",
                              e.target.checked,
                            )
                          }
                          size="small"
                          sx={{
                            color: item.isHazardous
                              ? "var(--danger)"
                              : "var(--muted)",
                            p: 0.5,
                            "&.Mui-checked": {
                              color: "var(--danger)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="caption"
                          sx={{
                            color: item.isHazardous
                              ? "var(--danger)"
                              : "var(--muted)",
                            fontWeight: item.isHazardous ? 600 : 400,
                            fontSize: "10px",
                            ml: -0.5,
                          }}
                        >
                          Hazardous
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Grid>

                  {/* Consignment Type */}
                  <Grid size={{ xs: 8, md: 1.8 }}>
                    <TextField
                      select
                      fullWidth
                      label="Type"
                      value={item.categoryId}
                      onChange={(e) =>
                        handleItemChange(index, "categoryId", e.target.value)
                      }
                      size="small"
                      className="compact-form-field"
                    >
                      {(itemCategories || []).map((type) => (
                        <MenuItem
                          key={type.categoryId}
                          value={type.categoryId}
                          className="compact-menu-item"
                        >
                          {type.categoryName}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Item Type */}
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      select
                      fullWidth
                      label="Item"
                      value={item.itemTypeId}
                      onChange={(e) =>
                        handleItemChange(index, "itemTypeId", e.target.value)
                      }
                      size="small"
                      disabled={!item.categoryId}
                      className="compact-form-field"
                    >
                      {(itemTypes || [])
                        .filter((type) => type.categoryId === item.categoryId)
                        .map((type) => (
                          <MenuItem
                            key={type.typeId}
                            value={type.typeId}
                            className="compact-menu-item"
                          >
                            {type.typeName}
                          </MenuItem>
                        ))}
                    </TextField>
                  </Grid>

                  {/* Quantity */}
                  <Grid size={{ xs: 4, md: 0.9 }}>
                    <TextField
                      fullWidth
                      label="Qty"
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          Number(e.target.value),
                        )
                      }
                      size="small"
                      className="compact-form-field"
                    />
                  </Grid>

                  {/* Unit */}
                  <Grid size={{ xs: 8, md: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="Unit"
                      value={item.unitOfMeasurement}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unitOfMeasurement",
                          e.target.value,
                        )
                      }
                      size="small"
                      className="compact-form-field"
                    >
                      {(uomUnits || []).map((unit) => (
                        <MenuItem
                          key={unit}
                          value={unit}
                          className="compact-menu-item"
                        >
                          {unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Dimensions */}
                  <Grid size={{ xs: 12, md: 1.6 }}>
                    <TextField
                      fullWidth
                      label="Dim"
                      placeholder="12x2x2"
                      value={item.dimensions || ""}
                      onChange={(e) =>
                        handleItemChange(index, "dimensions", e.target.value)
                      }
                      size="small"
                      className="compact-form-field"
                    />
                  </Grid>

                  {/* Dim Unit */}
                  <Grid size={{ xs: 6, md: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="Vol Unit"
                      value={item.dimensionUnit || "m3"}
                      onChange={(e) =>
                        handleItemChange(index, "dimensionUnit", e.target.value)
                      }
                      size="small"
                      className="compact-form-field"
                    >
                      {(dimensionUnits || []).map((unit) => (
                        <MenuItem
                          key={unit}
                          value={unit}
                          className="compact-menu-item"
                        >
                          {unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Weight */}
                  <Grid size={{ xs: 12, md: 1.1 }}>
                    <TextField
                      fullWidth
                      label="Wgt"
                      type="number"
                      value={item.weight || ""}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "weight",
                          Number(e.target.value),
                        )
                      }
                      size="small"
                      className="compact-form-field"
                    />
                  </Grid>

                  {/* Wgt Unit */}
                  <Grid size={{ xs: 6, md: 1 }}>
                    <TextField
                      select
                      fullWidth
                      label="Wgt Unit"
                      value={item.weightUnit || "tonnes"}
                      onChange={(e) =>
                        handleItemChange(index, "weightUnit", e.target.value)
                      }
                      size="small"
                      className="compact-form-field"
                    >
                      {(weightUnits || []).map((unit) => (
                        <MenuItem
                          key={unit}
                          value={unit}
                          className="compact-menu-item"
                        >
                          {unit}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Description */}
                  <Grid size={{ xs: 10, md: 3.4 }}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={item.description || ""}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      size="small"
                      className="compact-form-field"
                    />
                  </Grid>

                  {/* Delete Button */}
                  <Grid
                    size={{ xs: 2, md: 0.4 }}
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(index)}
                      sx={{
                        color: "var(--danger)",
                        bgcolor: "rgba(239, 68, 68, 0.1)",
                        "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
                        height: "32px",
                        width: "32px",
                      }}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            ))}
            {(formData.items || []).length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 8,
                  border: "2px dashed var(--border)",
                  borderRadius: 2,
                  bgcolor: "var(--accent-soft)",
                  opacity: 0.6,
                }}
              >
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  No items in manifest
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add items manually or upload a CSV file
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
