import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  IconButton,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { FileText, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { RequestDetails } from "./RequestDetails";
import { VoyageDetails } from "./VoyageDetails";
import { ItemsManifest } from "./ItemsManifest";
import type {
  MovementRequest,
  MovementRequestItem,
  UrgencyOption,
  UnitOfMeasurementOption,
  RequestTypeOption,
  BusinessUnitOption,
  ItemCategoryOption,
  ItemTypeOption,
  PredefinedContainer,
} from "../../../types/maritime/logistics";
import type { Route } from "../../../types/maritime/marine";
import { getRoutes } from "../../../services/maritime/routeService";
import { containerService } from "../../../services/maritime/containerService";
import { getVoyages } from "../../../services/maritime/voyageService";
import type { Voyage } from "../../../types/maritime/marine";
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
import { downloadManifest } from "../../../services/maritime/marineMovementService";

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
          requestId: "",
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
  const [predefinedContainers, setPredefinedContainers] = useState<
    PredefinedContainer[]
  >([]);
  const [uomUnits, setUomUnits] = useState<string[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const isReadOnly = formData.status === "Approved";

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
          containers,
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
          containerService.getContainers(),
        ]);
        setAvailableRoutes(routes);
        setDimensionUnits(dims);
        setWeightUnits(weights);
        setUrgencyOptions(urgencies);
        setRequestTypes(types);
        setBusinessUnits(bus);
        setItemCategories(categories);
        setItemTypes(iTypes);
        setPredefinedContainers(containers);
        setUomUnits(
          (uoms || []).map((u: UnitOfMeasurementOption) => u.unitLabel),
        );
        const allVoyages = await getVoyages();
        setVoyages(allVoyages);
      } catch (error) {
        console.error("Failed to load reference data", error);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredVoyages = voyages.filter((v) => {
    if (!formData.originId || !formData.destinationId) return false;
    const sameRoute =
      v.originId === formData.originId &&
      v.destinationId === formData.destinationId;
    if (!sameRoute) return false;

    const departureDate = dayjs(v.departureDateTime);
    const earliestDeparture = dayjs(formData.earliestDeparture).startOf("day");
    const now = dayjs();

    return (
      departureDate.isAfter(earliestDeparture.subtract(1, "minute")) &&
      departureDate.isAfter(now)
    );
  });

  const handleFormUpdate = (field: keyof MovementRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddItem = () => {
    const newItem: MovementRequestItem = {
      itemId: "",
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
    const updatedItem = { ...newItems[index], [field]: value };

    // Clear validation error when field is changed
    if (updatedItem.validationErrors && updatedItem.validationErrors[field]) {
      const newErrors = { ...updatedItem.validationErrors };
      delete newErrors[field];
      updatedItem.validationErrors =
        Object.keys(newErrors).length > 0 ? newErrors : undefined;
    }

    if (field === "categoryId" && value !== newItems[index].categoryId) {
      updatedItem.itemTypeId = "";
    }

    newItems[index] = updatedItem;
    handleFormUpdate("items", newItems);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      const newItems: MovementRequestItem[] = [];

      jsonData.forEach((row: any) => {
        // Map Excel columns (using original headers)
        const consignmentTypeLabel = row["Consignment Type"]?.toString();
        const itemTypeLabel = row["Item Type"]?.toString();
        const quantity = row["Qty"];
        const unitOfMeasurement = row["Unit"]?.toString();
        const description = row["Description"]?.toString();
        const dimensions = row["Dimensions"]?.toString();
        const dimensionUnit = row["Volume Unit"]?.toString();
        const weight = row["Weight"];

        if (!consignmentTypeLabel && !itemTypeLabel && !description) return;

        const validationErrors: Record<string, boolean> = {};

        // Find categoryId from label
        const consignmentType = itemCategories.find(
          (ct) =>
            ct.categoryName.toLowerCase() ===
            consignmentTypeLabel?.toLowerCase(),
        );
        if (!consignmentType) validationErrors.categoryId = true;

        // Find itemTypeId from label
        let itemType;
        if (consignmentType) {
          itemType = itemTypes
            .filter((it) => it.categoryId === consignmentType.categoryId)
            .find(
              (it) =>
                it.typeName.toLowerCase() === itemTypeLabel?.toLowerCase(),
            );
        }
        if (!itemType) validationErrors.itemTypeId = true;

        // Validate Unit
        const uomMatch = uomUnits.find(
          (u) => u.toLowerCase() === unitOfMeasurement?.toLowerCase(),
        );
        if (!uomMatch) validationErrors.unitOfMeasurement = true;

        // Validate Vol Unit
        const volUnitMatch = dimensionUnits.find(
          (v) => v.toLowerCase() === dimensionUnit?.toLowerCase(),
        );
        if (!volUnitMatch) validationErrors.dimensionUnit = true;

        newItems.push({
          itemId: "",
          categoryId: consignmentType?.categoryId || "",
          itemTypeId: itemType?.typeId || "",
          quantity: Number(quantity) || 0,
          unitOfMeasurement: uomMatch || unitOfMeasurement || "",
          description: description || "",
          dimensions: dimensions || "",
          dimensionUnit: volUnitMatch || dimensionUnit || "m3",
          weight: Number(weight) || 0,
          weightUnit: "tonnes",
          validationErrors:
            Object.keys(validationErrors).length > 0
              ? validationErrors
              : undefined,
        });
      });

      if (newItems.length > 0) {
        handleFormUpdate("items", [...(formData.items || []), ...newItems]);

        const hasErrors = newItems.some((item) => item.validationErrors);
        if (hasErrors) {
          setSnackbar({
            open: true,
            message:
              "Some items were not fully matched. Please review highlighted fields.",
            severity: "warning",
          });
        } else {
          setSnackbar({
            open: true,
            message: `Successfully uploaded ${newItems.length} items from Excel.`,
            severity: "success",
          });
        }
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleDownloadExcelTemplate = () => {
    const data = [
      [
        "Consignment Type",
        "Item Type",
        "Qty",
        "Unit",
        "Description",
        "Dimensions",
        "Volume Unit",
        "Weight",
      ],
      [
        "Cargo",
        "Pallet",
        2,
        "units",
        "Standard pallets of supplies",
        "120x100x150",
        "cm3",
        0.5,
      ],
      [
        "Waste",
        "Drum",
        5,
        "units",
        "Chemical containers",
        "60x60x90",
        "cm3",
        1.2,
      ],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Bulk Upload Template");
    XLSX.writeFile(wb, "bulk_upload_template.xlsx");
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = () => {
    if (!formData.originId || !formData.destinationId) return;
    onSubmit(formData);
  };

  const handleSaveDraft = () => {
    if (!formData.originId || !formData.destinationId) return;
    onSaveDraft(formData);
  };

  const handleDownloadManifest = async () => {
    if (!formData.requestId) return;
    setManifestLoading(true);
    try {
      await downloadManifest(formData.requestId);
    } catch (error) {
      console.error("Failed to download manifest", error);
    } finally {
      setManifestLoading(false);
    }
  };

  const selectedVoyage = voyages.find(
    (v) => v.voyageId === formData.selectedVoyageId,
  );
  const filteredContainers = selectedVoyage
    ? predefinedContainers.filter((c) => c.vesselId === selectedVoyage.vesselId)
    : [];

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
          {initialData
            ? "Edit Material Movement Request"
            : "New Material Movement Request"}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button onClick={onCancel} variant="outlined" color="inherit">
            Cancel
          </Button>
          {formData.requestId && (
            <IconButton
              onClick={handleDownloadManifest}
              disabled={manifestLoading}
              sx={{
                color: "var(--accent)",
                border: "1px solid var(--border)",
                "&:hover": { bgcolor: "var(--accent-soft)" },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
              title="Generate Manifest"
            >
              {manifestLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <FileText size={20} />
              )}
            </IconButton>
          )}
          <Button
            onClick={() => handleSaveDraft()}
            variant="contained"
            disabled={loading || isReadOnly}
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
            disabled={loading || isReadOnly}
            sx={{
              background:
                "linear-gradient(135deg, var(--accent), var(--success))",
              color: "var(--panel)",
              fontWeight: 700,
              fontSize: "12px",
              borderRadius: "999px",
              textTransform: "none",
              px: 3,
              boxShadow: isReadOnly ? "none" : "0 0 18px var(--accent-soft)",
              border: "none",
              "&:hover": {
                background:
                  "linear-gradient(135deg, var(--accent), var(--success))",
                opacity: 0.9,
                boxShadow: isReadOnly ? "none" : "0 0 25px var(--accent-soft)",
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
        <Grid size={{ xs: 12 }}>
          <RequestDetails
            formData={formData}
            handleFormUpdate={handleFormUpdate}
            requestTypes={requestTypes}
            urgencyOptions={urgencyOptions}
            businessUnits={businessUnits}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <VoyageDetails
            formData={formData}
            handleFormUpdate={handleFormUpdate}
            availableRoutes={availableRoutes}
            filteredVoyages={filteredVoyages}
            isReadOnly={isReadOnly}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <ItemsManifest
            formData={formData}
            handleItemChange={handleItemChange}
            handleRemoveItem={handleRemoveItem}
            handleAddItem={handleAddItem}
            handleBulkUpload={handleBulkUpload}
            onDownloadTemplate={handleDownloadExcelTemplate}
            itemCategories={itemCategories}
            itemTypes={itemTypes}
            uomUnits={uomUnits}
            dimensionUnits={dimensionUnits}
            weightUnits={weightUnits}
            predefinedContainers={filteredContainers}
          />
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
