import {
  Box,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Plus, Trash2, Package, Upload, Download } from "lucide-react";
import type {
  MovementRequest,
  MovementRequestItem,
  ItemCategoryOption,
  ItemTypeOption,
  PredefinedContainer,
} from "../../../types/maritime/logistics";
import { DimensionInput } from "./DimensionInput";

interface ItemsManifestProps {
  formData: MovementRequest;
  handleItemChange: (
    index: number,
    field: keyof MovementRequestItem,
    value: any,
  ) => void;
  handleRemoveItem: (index: number) => void;
  handleAddItem: () => void;
  handleBulkUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  itemCategories: ItemCategoryOption[];
  itemTypes: ItemTypeOption[];
  uomUnits: string[];
  dimensionUnits: string[];
  weightUnits: string[];
  predefinedContainers?: PredefinedContainer[];
  onDownloadTemplate?: () => void;
}

export const ItemsManifest = ({
  formData,
  handleItemChange,
  handleRemoveItem,
  handleAddItem,
  handleBulkUpload,
  itemCategories,
  itemTypes,
  uomUnits,
  dimensionUnits,
  weightUnits,
  predefinedContainers = [],
  onDownloadTemplate,
}: ItemsManifestProps) => {
  return (
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
          <Tooltip title="Bulk Upload (CSV)">
            <IconButton
              component="label"
              size="small"
              sx={{
                color: "var(--text)",
                bgcolor: "var(--panel-hover)",
                border: "1px solid var(--border)",
                "&:hover": { bgcolor: "var(--accent-soft)" },
              }}
            >
              <Upload size={18} />
              <input
                type="file"
                hidden
                accept=".xlsx, .xls"
                onChange={handleBulkUpload}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download Bulk Upload Template">
            <IconButton
              onClick={onDownloadTemplate}
              size="small"
              sx={{
                color: "var(--text)",
                bgcolor: "var(--panel-hover)",
                border: "1px solid var(--border)",
                "&:hover": { bgcolor: "var(--accent-soft)" },
              }}
            >
              <Download size={18} />
            </IconButton>
          </Tooltip>
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
            bgcolor: item.isHazardous ? "rgba(239, 68, 68, 0.04)" : "var(--bg)",
            borderColor: item.isHazardous ? "var(--danger)" : "var(--border)",
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: item.isHazardous
                ? "rgba(239, 68, 68, 0.08)"
                : "var(--accent-soft)",
              borderColor: item.isHazardous ? "var(--danger)" : "var(--accent)",
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
                      handleItemChange(index, "isHazardous", e.target.checked)
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
                error={!!item.validationErrors?.categoryId}
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
                error={!!item.validationErrors?.itemTypeId}
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

            <Grid size={{ xs: 4, md: 0.9 }}>
              <TextField
                fullWidth
                label="Qty"
                type="number"
                value={item.quantity || ""}
                onChange={(e) =>
                  handleItemChange(index, "quantity", Number(e.target.value))
                }
                size="small"
                className="compact-form-field"
              />
            </Grid>

            <Grid size={{ xs: 8, md: 1 }}>
              <TextField
                select
                fullWidth
                label="Unit"
                value={item.unitOfMeasurement}
                onChange={(e) =>
                  handleItemChange(index, "unitOfMeasurement", e.target.value)
                }
                size="small"
                className="compact-form-field"
                error={!!item.validationErrors?.unitOfMeasurement}
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

            <Grid size={{ xs: 12, md: 1.6 }}>
              <DimensionInput
                label="Dim"
                value={item.dimensions || ""}
                onChange={(val: string) =>
                  handleItemChange(index, "dimensions", val)
                }
                error={!!item.validationErrors?.dimensions}
              />
            </Grid>

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
                error={!!item.validationErrors?.dimensionUnit}
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

            <Grid size={{ xs: 12, md: 1.1 }}>
              <TextField
                fullWidth
                label="Wgt"
                type="number"
                value={item.weight || ""}
                onChange={(e) =>
                  handleItemChange(index, "weight", Number(e.target.value))
                }
                size="small"
                className="compact-form-field"
              />
            </Grid>

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
                {weightUnits.map((unit) => (
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

            <Grid size={{ xs: 12, md: 1.8 }}>
              <TextField
                select
                fullWidth
                label="Container"
                value={item.containerId || ""}
                onChange={(e) =>
                  handleItemChange(index, "containerId", e.target.value)
                }
                size="small"
                className="compact-form-field"
              >
                <MenuItem value="" className="compact-menu-item">
                  <em>None</em>
                </MenuItem>
                {predefinedContainers.map((container) => (
                  <MenuItem
                    key={container.containerId}
                    value={container.containerId}
                    className="compact-menu-item"
                  >
                    {container.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 10, md: 3 }}>
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
  );
};
