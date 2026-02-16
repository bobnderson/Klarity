import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  Grid,
  Paper,
  MenuItem,
  Typography,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Tab,
  Tabs,
  InputAdornment,
  LinearProgress,
  Chip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Plus,
  Trash2,
  Users as UsersIcon,
  Briefcase,
  ArrowRightLeft,
  Info,
  Download,
} from "lucide-react";
import dayjs from "dayjs";
import type {
  MovementRequest,
  MovementRequestItem,
  UrgencyOption,
  RequestTypeOption,
  BusinessUnitOption,
  ItemCategoryOption,
  ItemTypeOption,
} from "../../../types/maritime/logistics";
import type { Route } from "../../../types/maritime/marine";
import { getRoutes } from "../../../services/maritime/routeService";
import {
  getUrgencyOptions,
  getRequestTypes,
  getBusinessUnits,
  getItemCategories,
  getItemTypes,
} from "../../../services/maritime/referenceDataService";
import { searchFlights } from "../../../services/maritime/flightService";
import type { User } from "../../../types/auth";
import type { Flight } from "../../../types/aviation/flight";
import {
  Plane,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  PlaneTakeoff,
  PlaneLanding,
  Search,
  Calendar,
  Edit2,
} from "lucide-react";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface AviationRequestFormProps {
  initialData?: MovementRequest;
  onSubmit: (data: MovementRequest) => void;
  onSaveDraft: (data: MovementRequest) => void;
  onCancel: () => void;
  loading?: boolean;
  readOnly?: boolean;
}

export function AviationRequestForm({
  initialData,
  onSubmit,
  onSaveDraft,
  onCancel,
  loading = false,
  readOnly = false,
}: AviationRequestFormProps) {
  const user: User | null = JSON.parse(
    sessionStorage.getItem("user_data") || "null",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [tripType, setTripType] = useState(0);

  const [formData, setFormData] = useState<MovementRequest>(
    initialData
      ? { ...initialData }
      : {
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
          lifting: "Normal",
          costCentre: "6",
          businessUnitId: "bu-003",
          notify: [],
        },
  );

  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
  const [urgencyOptions, setUrgencyOptions] = useState<UrgencyOption[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestTypeOption[]>([]);
  const [businessUnits, setBusinessUnits] = useState<BusinessUnitOption[]>([]);
  const [itemCategories, setItemCategories] = useState<ItemCategoryOption[]>(
    [],
  );
  const [itemTypes, setItemTypes] = useState<ItemTypeOption[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [outboundSearchResults, setOutboundSearchResults] = useState<Flight[]>(
    [],
  );
  const [returnSearchResults, setReturnSearchResults] = useState<Flight[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOutboundVoyage, setSelectedOutboundVoyage] =
    useState<Flight | null>(null);
  const [selectedReturnVoyage, setSelectedReturnVoyage] =
    useState<Flight | null>(null);
  const [paxCount, setPaxCount] = useState(1);

  // Sync baggage weight and pax count from items
  useEffect(() => {
    const totalPax = (formData.items || [])
      .filter(
        (i) =>
          i.categoryId === "personnel" ||
          i.unitOfMeasurement?.toLowerCase() === "pax",
      )
      .reduce((s, i) => s + (i.quantity || 0), 0);
    setPaxCount(totalPax > 0 ? totalPax : 1);
  }, [formData.items]);

  // Initial data sync for tripType
  useEffect(() => {
    if (initialData) {
      if (initialData.tripType === "RoundTrip") {
        setTripType(1);
      } else {
        setTripType(0);
      }
    }
  }, [initialData]);

  useEffect(() => {
    const loadData = async () => {
      setDataLoading(true);
      try {
        const [routes, urgencies, types, bus, categories, allItemTypes] =
          await Promise.all([
            getRoutes(),
            getUrgencyOptions(),
            getRequestTypes("Aviation"),
            getBusinessUnits(),
            getItemCategories(),
            getItemTypes(),
          ]);
        setAvailableRoutes(routes);
        setUrgencyOptions(urgencies);
        setRequestTypes(types);
        setBusinessUnits(bus);
        setItemCategories(categories);
        setItemTypes(allItemTypes);
      } catch (error) {
        console.error("Failed to load reference data", error);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  // Effect to load voyages when in edit mode
  useEffect(() => {
    const loadEditingVoyages = async () => {
      if (!initialData) return;

      const flightService =
        await import("../../../services/maritime/flightService");

      try {
        if (initialData.selectedVoyageId) {
          const outbound = await flightService.getFlightById(
            initialData.selectedVoyageId,
          );
          setSelectedOutboundVoyage(outbound);
        }
        if (initialData.returnVoyageId) {
          const returnFlight = await flightService.getFlightById(
            initialData.returnVoyageId,
          );
          setSelectedReturnVoyage(returnFlight);
        }

        // If it's an existing request, jump to the review step
        if (initialData.requestId && !initialData.requestId.startsWith("AV-")) {
          setActiveStep(3);
        }
      } catch (error) {
        console.error("Failed to load existing voyages", error);
      }
    };

    loadEditingVoyages();
  }, [initialData]);

  const handleFormUpdate = (field: keyof MovementRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    const newItem: MovementRequestItem = {
      itemId: `ITEM-${Date.now()}`,
      categoryId: "personnel",
      itemTypeId: "",
      quantity: 1,
      unitOfMeasurement: "PAX",
      description: "",
      dimensions: "",
      dimensionUnit: "m3",
      volume: 0,
      weight: 0.1,
      weightUnit: "tonnes",
      isHazardous: false,
    };

    // Auto-select first item type for this category
    const defaultType = itemTypes.find(
      (t) => t.categoryId === newItem.categoryId,
    );
    if (defaultType) {
      newItem.itemTypeId = defaultType.typeId;
    }

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
    newItems[index] = { ...newItems[index], [field]: value };

    // If category changes, update item type
    if (field === "categoryId") {
      const defaultType = itemTypes.find((t) => t.categoryId === value);
      if (defaultType) {
        newItems[index].itemTypeId = defaultType.typeId;
      } else {
        newItems[index].itemTypeId = "";
      }
    }

    handleFormUpdate("items", newItems);
  };

  const swapLocations = () => {
    const tmp = formData.originId;
    setFormData((prev) => ({
      ...prev,
      originId: prev.destinationId,
      destinationId: tmp,
    }));
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const newItems: MovementRequestItem[] = data.map((row: any) => {
        const category = (row.Category || "Personnel").toLowerCase();
        const catId = category === "personnel" ? "personnel" : "cargo";
        const defaultType = itemTypes.find((t) => t.categoryId === catId);

        return {
          itemId: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          categoryId: catId,
          itemTypeId: defaultType?.typeId || "",
          quantity: Number(row.Quantity) || 1,
          unitOfMeasurement: catId === "personnel" ? "PAX" : "KG",
          description: row.Name || row.Description || "Imported Item",
          dimensions: "",
          dimensionUnit: "m3",
          volume: 0,
          weight: row["Weight (kg)"] ? Number(row["Weight (kg)"]) / 1000 : 0.1,
          weightUnit: "tonnes",
          isHazardous: false,
        };
      });

      handleFormUpdate("items", [...(formData.items || []), ...newItems]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Category: "Personnel",
        Name: "John Doe",
      },
      {
        Category: "Cargo",
        Name: "Spare Engine Parts",
        Quantity: 2,
        "Weight (kg)": 250.5,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Klarity_Aviation_Template.xlsx");
  };

  const steps = [
    "Search Flights",
    "Select Flight",
    "Passengers & Payload",
    "Review & Submit",
  ];

  const handleSearch = async () => {
    if (!formData.originId || !formData.destinationId) return;
    setSearching(true);
    setOutboundSearchResults([]);
    setReturnSearchResults([]);
    setSelectedOutboundVoyage(null);
    setSelectedReturnVoyage(null);

    try {
      const searches = [
        searchFlights(
          formData.originId,
          formData.destinationId,
          formData.earliestDeparture,
          paxCount,
        ),
      ];

      if (tripType === 1 && formData.returnEarliestDeparture) {
        searches.push(
          searchFlights(
            formData.destinationId, // Return Origin (Outbound Dest)
            formData.originId, // Return Dest (Outbound Origin)
            formData.returnEarliestDeparture,
            paxCount,
          ),
        );
      }

      const results = await Promise.all(searches);
      setOutboundSearchResults(results[0]);
      if (results[1]) {
        setReturnSearchResults(results[1]);
      }
      setActiveStep(1);
    } catch (error) {
      console.error("Flight search failed", error);
    } finally {
      setSearching(false);
    }
  };

  const nextStep = () => setActiveStep((prev) => prev + 1);
  const prevStep = () => setActiveStep((prev) => prev - 1);

  const getOriginName = () =>
    availableRoutes.find((r) => r.routeId === formData.originId)?.route ||
    "Origin";
  const getDestName = () =>
    availableRoutes.find((r) => r.routeId === formData.destinationId)?.route ||
    "Destination";

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "var(--bg)", pb: 10 }}>
      {/* Flight Search Style Header */}
      <Box
        sx={{
          background:
            "linear-gradient(180deg, var(--panel) 0%, var(--bg) 100%)",
          pt: 4,
          pb: 6,
          px: 4,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mb: 1, color: "var(--text)" }}
          >
            Book a Flight
          </Typography>
          <Typography
            variant="body1"
            sx={{ mb: 4, color: "var(--text-secondary)", opacity: 0.8 }}
          >
            Schedule helicopter movements for personnel and critical equipment.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "24px",
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {dataLoading && (
              <LinearProgress
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                }}
              />
            )}
            <Tabs
              value={tripType}
              onChange={(_, v) => setTripType(v)}
              sx={{ mb: 3, minHeight: 40 }}
            >
              <Tab
                label="One Way"
                sx={{ textTransform: "none", fontWeight: 700 }}
              />
              <Tab
                label="Round Trip"
                sx={{ textTransform: "none", fontWeight: 700 }}
              />
            </Tabs>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Outbound Row */}
              <Grid size={{ xs: 12 }}>
                <Typography
                  variant="subtitle2"
                  color="var(--text-secondary)"
                  sx={{
                    mb: 1,
                    ml: 1,
                    display: tripType === 1 ? "block" : "none",
                  }}
                >
                  Outbound Flight
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: tripType === 1 ? 3 : 4 }}>
                    <Autocomplete
                      fullWidth
                      options={availableRoutes}
                      getOptionLabel={(option) => option.route}
                      value={
                        availableRoutes.find(
                          (r) => r.routeId === formData.originId,
                        ) || null
                      }
                      onChange={(_, v) =>
                        handleFormUpdate("originId", v?.routeId || "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Departing From"
                          placeholder="Departure Base"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PlaneTakeoff size={18} color="var(--accent)" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid
                    size={{ xs: 12, md: 1 }}
                    sx={{
                      display: tripType === 1 ? "none" : "flex",
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      onClick={swapLocations}
                      sx={{
                        bgcolor: "var(--panel-hover)",
                        "&:hover": { bgcolor: "var(--accent-alpha)" },
                      }}
                    >
                      <ArrowRightLeft size={18} />
                    </IconButton>
                  </Grid>
                  <Grid size={{ xs: 12, md: tripType === 1 ? 3 : 4 }}>
                    <Autocomplete
                      fullWidth
                      options={availableRoutes}
                      getOptionLabel={(option) => option.route}
                      value={
                        availableRoutes.find(
                          (r) => r.routeId === formData.destinationId,
                        ) || null
                      }
                      onChange={(_, v) =>
                        handleFormUpdate("destinationId", v?.routeId || "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Arriving At"
                          placeholder="Destination Platform"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PlaneLanding
                                  size={18}
                                  color="var(--success)"
                                />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <DatePicker
                      label="Departure Date"
                      value={dayjs(formData.earliestDeparture)}
                      onChange={(v) =>
                        handleFormUpdate("earliestDeparture", v?.toISOString())
                      }
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          InputProps: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Calendar size={18} color="var(--accent)" />
                              </InputAdornment>
                            ),
                          },
                        },
                      }}
                    />
                  </Grid>
                  {tripType === 1 && (
                    <Grid size={{ xs: 12, md: 3 }}>
                      <DatePicker
                        label="Return Date"
                        value={
                          formData.returnEarliestDeparture
                            ? dayjs(formData.returnEarliestDeparture)
                            : null
                        }
                        onChange={(v) =>
                          handleFormUpdate(
                            "returnEarliestDeparture",
                            v?.toISOString(),
                          )
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            InputProps: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Calendar size={18} color="var(--accent)" />
                                </InputAdornment>
                              ),
                            },
                          },
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={
                  searching ||
                  !formData.originId ||
                  !formData.destinationId ||
                  readOnly
                }
                className="btn-primary-gradient"
                startIcon={!searching && <Search size={20} />}
                sx={{
                  height: 48,
                  width: { xs: "100%", md: 200 },
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "1rem",
                  letterSpacing: "0.5px",
                  textTransform: "none",
                  boxShadow: "0 6px 12px var(--accent-alpha)",
                  "&:hover": {
                    boxShadow: "0 8px 16px var(--accent-alpha)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                {searching ? "Searching..." : "Search Flights"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Stepper Content */}
      <Box sx={{ maxWidth: 1200, mx: "auto", mt: -4, px: 2 }}>
        <Paper
          sx={{
            p: 4,
            borderRadius: "24px",
            bgcolor: "var(--panel)",
            border: "1px solid var(--border)",
          }}
        >
          <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                Flight Context
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Purpose of Flight"
                    value={formData.requestTypeId || ""}
                    onChange={(e) =>
                      handleFormUpdate("requestTypeId", e.target.value)
                    }
                  >
                    {requestTypes.map((t) => (
                      <MenuItem key={t.requestTypeId} value={t.requestTypeId}>
                        {t.requestType}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Urgency"
                    value={formData.urgencyId || "routine-operations"}
                    onChange={(e) =>
                      handleFormUpdate("urgencyId", e.target.value)
                    }
                  >
                    {urgencyOptions.map((o) => (
                      <MenuItem key={o.urgencyId} value={o.urgencyId}>
                        {o.urgencyLabel}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Business Unit"
                    value={formData.businessUnitId || ""}
                    onChange={(e) =>
                      handleFormUpdate("businessUnitId", e.target.value)
                    }
                  >
                    {businessUnits.map((bu) => (
                      <MenuItem
                        key={bu.businessUnitId}
                        value={bu.businessUnitId}
                      >
                        {bu.businessUnit}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Flight Notes / Specific Instructions"
                    multiline
                    rows={3}
                    value={formData.comments || ""}
                    onChange={(e) =>
                      handleFormUpdate("comments", e.target.value)
                    }
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 6, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={() => setActiveStep(1)}
                  variant="outlined"
                  sx={{ borderRadius: "8px", px: 4, mr: 2 }}
                >
                  View All Flights
                </Button>
                <Button
                  onClick={nextStep}
                  variant="contained"
                  disabled={!formData.originId || !formData.destinationId}
                  sx={{ borderRadius: "8px", px: 4 }}
                >
                  Continue to Passengers
                </Button>
              </Box>
            </Box>
          )}

          {activeStep > 0 && activeStep < 3 && (
            <Box
              sx={{
                mb: 4,
                p: 2,
                borderRadius: "12px",
                bgcolor: "rgba(255, 178, 0, 0.05)",
                border: "1px solid rgba(255, 178, 0, 0.2)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    PURPOSE
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {requestTypes.find(
                      (t) => t.requestTypeId === formData.requestTypeId,
                    )?.requestType || "Not Specified"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    URGENCY
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {urgencyOptions.find(
                      (o) => o.urgencyId === formData.urgencyId,
                    )?.urgencyLabel || "Routine"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mb: 0.5 }}
                  >
                    BUSINESS UNIT
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {businessUnits.find(
                      (bu) => bu.businessUnitId === formData.businessUnitId,
                    )?.businessUnit || "Aviation"}
                  </Typography>
                </Box>
                {formData.comments && (
                  <Box sx={{ maxWidth: 300 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 0.5 }}
                    >
                      FLIGHT NOTES
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formData.comments}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Button
                size="small"
                startIcon={<Edit2 size={14} />}
                onClick={() => setActiveStep(0)}
                sx={{
                  color: "var(--accent)",
                  fontWeight: 700,
                  "&:hover": { bgcolor: "rgba(255, 178, 0, 0.1)" },
                }}
              >
                Edit Context
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Select Outbound Flight
                </Typography>
                {outboundSearchResults.length === 0 ? (
                  <Box
                    sx={{
                      p: 4,
                      textAlign: "center",
                      bgcolor: "var(--panel-hover)",
                      borderRadius: "16px",
                      border: "1px dashed var(--border)",
                    }}
                  >
                    <AlertCircle
                      size={32}
                      color="var(--text-secondary)"
                      style={{ opacity: 0.5, marginBottom: 12 }}
                    />
                    <Typography variant="body1" color="var(--text-secondary)">
                      No outbound flights found.
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    {outboundSearchResults.map((flight) => (
                      <Paper
                        key={flight.flightId}
                        elevation={0}
                        onClick={() => {
                          setSelectedOutboundVoyage(flight);
                          handleFormUpdate(
                            "selectedVoyageId" as any,
                            flight.flightId,
                          );
                        }}
                        sx={{
                          p: 3,
                          borderRadius: "16px",
                          border: "2px solid",
                          borderColor:
                            selectedOutboundVoyage?.flightId === flight.flightId
                              ? "var(--accent)"
                              : "var(--border)",
                          bgcolor:
                            selectedOutboundVoyage?.flightId === flight.flightId
                              ? "var(--accent-alpha)"
                              : "var(--panel-hover)",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            borderColor: "var(--accent)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid size={{ xs: 12, md: 3 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "var(--accent)",
                                  width: 40,
                                  height: 40,
                                }}
                              >
                                <Plane size={20} color="white" />
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={800}
                                >
                                  {flight.helicopterName || "Helicopter"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="var(--text-secondary)"
                                >
                                  {flight.helicopterId}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, md: 5 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 2,
                              }}
                            >
                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="h6" fontWeight={800}>
                                  {dayjs(flight.departureDateTime).format(
                                    "HH:mm",
                                  )}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {dayjs(flight.departureDateTime).format(
                                    "ddd, DD MMM",
                                  )}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  position: "relative",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: "100%",
                                    height: 1,
                                    bgcolor: "var(--border)",
                                    position: "relative",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      right: 0,
                                      top: -4,
                                    }}
                                  >
                                    <ChevronRight
                                      size={10}
                                      color="var(--text-secondary)"
                                    />
                                  </Box>
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    mt: 1,
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {dayjs(flight.arrivalDateTime).diff(
                                    dayjs(flight.departureDateTime),
                                    "minute",
                                  )}
                                  m
                                </Typography>
                              </Box>
                              <Box>
                                <Typography variant="h6" fontWeight={800}>
                                  {dayjs(flight.arrivalDateTime).format(
                                    "HH:mm",
                                  )}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {dayjs(flight.arrivalDateTime).format(
                                    "ddd, DD MMM",
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: 3,
                              }}
                            >
                              <Box sx={{ textAlign: "right" }}>
                                <Typography
                                  variant="h5"
                                  fontWeight={900}
                                  color="var(--accent)"
                                >
                                  {formatCurrency(flight.costPerPax || 0)}
                                </Typography>
                                <Typography variant="caption">
                                  per person
                                </Typography>
                              </Box>
                              {selectedOutboundVoyage?.flightId ===
                              flight.flightId ? (
                                <CheckCircle2 color="var(--accent)" size={24} />
                              ) : (
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    border: "2px solid var(--border)",
                                  }}
                                />
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>

              {tripType === 1 && (
                <Box sx={{ mb: 4 }}>
                  <Divider sx={{ my: 4 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Select Return Flight
                  </Typography>
                  {returnSearchResults.length === 0 ? (
                    <Box
                      sx={{
                        p: 4,
                        textAlign: "center",
                        bgcolor: "var(--panel-hover)",
                        borderRadius: "16px",
                        border: "1px dashed var(--border)",
                      }}
                    >
                      <AlertCircle
                        size={32}
                        color="var(--text-secondary)"
                        style={{ opacity: 0.5, marginBottom: 12 }}
                      />
                      <Typography variant="body1" color="var(--text-secondary)">
                        No return flights found.
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {returnSearchResults.map((flight) => (
                        <Paper
                          key={flight.flightId}
                          elevation={0}
                          onClick={() => {
                            setSelectedReturnVoyage(flight);
                            handleFormUpdate(
                              "returnVoyageId" as any,
                              flight.flightId,
                            );
                          }}
                          sx={{
                            p: 3,
                            borderRadius: "16px",
                            border: "2px solid",
                            borderColor:
                              selectedReturnVoyage?.flightId === flight.flightId
                                ? "var(--accent)"
                                : "var(--border)",
                            bgcolor:
                              selectedReturnVoyage?.flightId === flight.flightId
                                ? "var(--accent-alpha)"
                                : "var(--panel-hover)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              borderColor: "var(--accent)",
                              transform: "translateY(-2px)",
                            },
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid size={{ xs: 12, md: 3 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    bgcolor: "var(--accent)",
                                    width: 40,
                                    height: 40,
                                  }}
                                >
                                  <Plane size={20} color="white" />
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    fontWeight={800}
                                  >
                                    {flight.helicopterName || "Helicopter"}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="var(--text-secondary)"
                                  >
                                    {flight.helicopterId}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 2,
                                }}
                              >
                                <Box sx={{ textAlign: "right" }}>
                                  <Typography variant="h6" fontWeight={800}>
                                    {dayjs(flight.departureDateTime).format(
                                      "HH:mm",
                                    )}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {dayjs(flight.departureDateTime).format(
                                      "ddd, DD MMM",
                                    )}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    position: "relative",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: "100%",
                                      height: 1,
                                      bgcolor: "var(--border)",
                                      position: "relative",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        right: 0,
                                        top: -4,
                                      }}
                                    >
                                      <ChevronRight
                                        size={10}
                                        color="var(--text-secondary)"
                                      />
                                    </Box>
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 1,
                                      color: "var(--text-secondary)",
                                    }}
                                  >
                                    {dayjs(flight.arrivalDateTime).diff(
                                      dayjs(flight.departureDateTime),
                                      "minute",
                                    )}
                                    m
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="h6" fontWeight={800}>
                                    {dayjs(flight.arrivalDateTime).format(
                                      "HH:mm",
                                    )}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    {dayjs(flight.arrivalDateTime).format(
                                      "ddd, DD MMM",
                                    )}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  gap: 3,
                                }}
                              >
                                <Box sx={{ textAlign: "right" }}>
                                  <Typography
                                    variant="h5"
                                    fontWeight={900}
                                    color="var(--accent)"
                                  >
                                    {formatCurrency(flight.costPerPax || 0)}
                                  </Typography>
                                  <Typography variant="caption">
                                    per person
                                  </Typography>
                                </Box>
                                {selectedReturnVoyage?.flightId ===
                                flight.flightId ? (
                                  <CheckCircle2
                                    color="var(--accent)"
                                    size={24}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: "50%",
                                      border: "2px solid var(--border)",
                                    }}
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              <Box
                sx={{
                  mt: 6,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Button
                  onClick={() => setActiveStep(0)}
                  variant="outlined"
                  sx={{ borderRadius: "8px", px: 4 }}
                >
                  Back to Search
                </Button>
                <Button
                  onClick={nextStep}
                  variant="contained"
                  disabled={
                    tripType === 1
                      ? !selectedOutboundVoyage || !selectedReturnVoyage
                      : !selectedOutboundVoyage
                  }
                  sx={{ borderRadius: "8px", px: 4 }}
                >
                  Continue to Passengers
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Passengers & Cargo
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelImport}
                  />
                  <Button
                    startIcon={<Download size={18} />}
                    onClick={handleDownloadTemplate}
                    variant="outlined"
                    sx={{ borderRadius: "8px", borderStyle: "dashed" }}
                  >
                    Template
                  </Button>
                  <Button
                    startIcon={<Search size={18} />}
                    onClick={() => fileInputRef.current?.click()}
                    variant="outlined"
                    sx={{ borderRadius: "8px" }}
                  >
                    Import from Excel
                  </Button>
                  <Button
                    startIcon={<Plus size={18} />}
                    onClick={handleAddItem}
                    variant="outlined"
                    sx={{ borderRadius: "8px" }}
                  >
                    Add Passenger/Item
                  </Button>
                </Box>
              </Box>

              {formData.items.length === 0 ? (
                <Box
                  sx={{
                    p: 8,
                    border: "2px dashed var(--border)",
                    borderRadius: "16px",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  <UsersIcon
                    size={48}
                    style={{ opacity: 0.3, marginBottom: 16 }}
                  />
                  <Typography>No passengers or items added yet.</Typography>
                  <Button sx={{ mt: 2 }} onClick={handleAddItem}>
                    Add the first one
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {formData.items.map((item, index) => (
                    <Paper
                      key={item.itemId}
                      sx={{
                        p: 2,
                        bgcolor: "var(--panel-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        position: "relative",
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Category"
                            value={item.categoryId}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "categoryId",
                                e.target.value,
                              )
                            }
                          >
                            {itemCategories.map((c) => (
                              <MenuItem key={c.categoryId} value={c.categoryId}>
                                {c.categoryName}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid
                          size={{
                            xs: 12,
                            md: item.categoryId === "personnel" ? 8 : 4,
                          }}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            label="Name / Specification"
                            placeholder={
                              item.categoryId === "personnel"
                                ? "Passenger Name"
                                : "Item Description"
                            }
                            value={item.description || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                          />
                        </Grid>
                        {item.categoryId !== "personnel" && (
                          <>
                            <Grid size={{ xs: 6, md: 2 }}>
                              <TextField
                                fullWidth
                                size="small"
                                type="number"
                                label="Qty"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                              />
                            </Grid>
                            <Grid size={{ xs: 6, md: 2 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Weight (kg)"
                                value={item.weight ? item.weight * 1000 : 0}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "weight",
                                    Number(e.target.value) / 1000,
                                  )
                                }
                              />
                            </Grid>
                          </>
                        )}
                        <Grid size={{ xs: 12, md: 1 }}>
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Box>
              )}

              <Box
                sx={{ mt: 6, display: "flex", justifyContent: "space-between" }}
              >
                <Button
                  onClick={prevStep}
                  variant="outlined"
                  sx={{ borderRadius: "8px", px: 4 }}
                >
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  variant="contained"
                  disabled={formData.items.length === 0}
                  sx={{ borderRadius: "8px", px: 4 }}
                >
                  Review Itinerary
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 4 }}>
                Review Reservation
              </Typography>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper
                    sx={{
                      p: 4,
                      bgcolor: "var(--panel-hover)",
                      borderRadius: "20px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {/* Outbound Summaries */}
                    <Box sx={{ mb: 4 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="var(--accent)"
                        sx={{ mb: 2 }}
                      >
                        OUTBOUND FLIGHT
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="var(--text-secondary)"
                          >
                            DEPARTURE
                          </Typography>
                          <Typography variant="h5" fontWeight={800}>
                            {getOriginName()}
                          </Typography>
                          <Typography variant="body2">
                            {dayjs(
                              selectedOutboundVoyage?.departureDateTime,
                            ).format("ddd, DD MMM YYYY · HH:mm")}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            pt: 1,
                          }}
                        >
                          <PlaneTakeoff size={16} color="var(--accent)" />
                          <Box
                            sx={{
                              width: 60,
                              height: 2,
                              bgcolor: "var(--border)",
                              my: 1,
                            }}
                          />
                          <Typography variant="caption">Direct</Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography
                            variant="caption"
                            color="var(--text-secondary)"
                          >
                            ARRIVAL
                          </Typography>
                          <Typography variant="h5" fontWeight={800}>
                            {getDestName()}
                          </Typography>
                          <Typography variant="body2">
                            {dayjs(
                              selectedOutboundVoyage?.arrivalDateTime,
                            ).format("ddd, DD MMM YYYY · HH:mm")}
                          </Typography>
                        </Box>
                      </Box>

                      {selectedOutboundVoyage && (
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: "12px",
                            bgcolor: "var(--accent-alpha)",
                            border: "1px solid var(--accent)",
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          <Plane size={20} color="var(--accent)" />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {selectedOutboundVoyage.helicopterName ||
                                "Helicopter"}{" "}
                              ({selectedOutboundVoyage.helicopterId})
                            </Typography>
                            <Typography variant="caption">
                              Standard Aviation Fare Applied
                            </Typography>
                          </Box>
                          <Typography
                            variant="h6"
                            fontWeight={900}
                            color="var(--accent)"
                          >
                            {formatCurrency(
                              (selectedOutboundVoyage.costPerPax || 0) *
                                formData.items
                                  .filter((i) => i.categoryId === "personnel")
                                  .reduce((s, i) => s + i.quantity, 0),
                            )}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Return Summaries */}
                    {tripType === 1 && selectedReturnVoyage && (
                      <>
                        <Divider sx={{ my: 4 }} />
                        <Box sx={{ mb: 4 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="var(--accent)"
                            sx={{ mb: 2 }}
                          >
                            RETURN FLIGHT
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 2,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                color="var(--text-secondary)"
                              >
                                DEPARTURE
                              </Typography>
                              <Typography variant="h5" fontWeight={800}>
                                {getDestName()}
                              </Typography>
                              <Typography variant="body2">
                                {dayjs(
                                  selectedReturnVoyage?.departureDateTime,
                                ).format("ddd, DD MMM YYYY · HH:mm")}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                pt: 1,
                              }}
                            >
                              <PlaneLanding size={16} color="var(--accent)" />
                              <Box
                                sx={{
                                  width: 60,
                                  height: 2,
                                  bgcolor: "var(--border)",
                                  my: 1,
                                }}
                              />
                              <Typography variant="caption">Direct</Typography>
                            </Box>
                            <Box sx={{ textAlign: "right" }}>
                              <Typography
                                variant="caption"
                                color="var(--text-secondary)"
                              >
                                ARRIVAL
                              </Typography>
                              <Typography variant="h5" fontWeight={800}>
                                {getOriginName()}
                              </Typography>
                              <Typography variant="body2">
                                {dayjs(
                                  selectedReturnVoyage?.arrivalDateTime,
                                ).format("ddd, DD MMM YYYY · HH:mm")}
                              </Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              p: 2,
                              borderRadius: "12px",
                              bgcolor: "var(--accent-alpha)",
                              border: "1px solid var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Plane size={20} color="var(--accent)" />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {selectedReturnVoyage.helicopterName ||
                                  "Helicopter"}{" "}
                                ({selectedReturnVoyage.helicopterId})
                              </Typography>
                              <Typography variant="caption">
                                Standard Aviation Fare Applied
                              </Typography>
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight={900}
                              color="var(--accent)"
                            >
                              {formatCurrency(
                                (selectedReturnVoyage.costPerPax || 0) *
                                  formData.items
                                    .filter((i) => i.categoryId === "personnel")
                                    .reduce((s, i) => s + i.quantity, 0),
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ mb: 2 }}
                    >
                      Passenger List
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}
                    >
                      {formData.items
                        .filter((i) => i.categoryId === "personnel")
                        .map((pax) => (
                          <Chip
                            key={pax.itemId}
                            icon={<UsersIcon size={14} />}
                            label={pax.description || "Unnamed Passenger"}
                            variant="outlined"
                            sx={{
                              borderColor: "var(--accent-alpha)",
                              bgcolor: "rgba(255, 178, 0, 0.05)",
                              fontWeight: 600,
                            }}
                          />
                        ))}
                    </Box>

                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      sx={{ mb: 2 }}
                    >
                      Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "var(--accent-alpha)",
                              color: "var(--accent)",
                            }}
                          >
                            <UsersIcon size={16} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" display="block">
                              Passengers
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {formData.items
                                .filter((i) => i.categoryId === "personnel")
                                .reduce((s, i) => s + i.quantity, 0)}{" "}
                              Pax
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: "var(--success-alpha)",
                              color: "var(--success)",
                            }}
                          >
                            <Briefcase size={16} />
                          </Avatar>
                          <Box>
                            <Typography variant="caption" display="block">
                              Cargo Payload
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {(
                                formData.items.reduce(
                                  (s, i) => s + (i.weight || 0),
                                  0,
                                ) * 1000
                              ).toFixed(0)}{" "}
                              kg
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{
                      p: 3,
                      border: "1px solid var(--border)",
                      borderRadius: "20px",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Info size={16} color="var(--accent)" />
                      <Typography variant="subtitle2">
                        Booking Information
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="var(--text-secondary)"
                      sx={{ mb: 3 }}
                    >
                      This request will be sent to the Aviation Planning team
                      for review. You will receive a notification once the
                      flight is confirmed.
                    </Typography>
                    <Typography
                      variant="body2"
                      color="var(--text-secondary)"
                      sx={{ mb: 3 }}
                    >
                      All passengers flying offshore should have valid OSP,
                      Bossiet and other safety certifications required for
                      offshore flights.
                    </Typography>

                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => onSubmit(formData)}
                      disabled={loading}
                      className="btn-primary-gradient"
                      sx={{
                        py: 1.5,
                        borderRadius: "10px",
                        fontWeight: 700,
                        mb: 2,
                      }}
                    >
                      {loading
                        ? "Submitting..."
                        : "Confirm & Send for Approval"}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => onSaveDraft(formData)}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        borderRadius: "10px",
                        fontWeight: 700,
                        mb: 2,
                      }}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      fullWidth
                      onClick={prevStep}
                      sx={{
                        color: "var(--text-secondary)",
                        textTransform: "none",
                      }}
                    >
                      Back to Passenger Details
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Sticky Bottom Actions if needed or Cancel */}
      <Box
        sx={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <Button
          onClick={onCancel}
          variant="contained"
          sx={{
            bgcolor: "var(--panel)",
            color: "var(--text)",
            px: 4,
            borderRadius: "99px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            "&:hover": { bgcolor: "var(--panel-hover)" },
          }}
        >
          {readOnly ? "Close" : "Cancel Booking"}
        </Button>
      </Box>
    </Box>
  );
}
