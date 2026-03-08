import {
  Box,
  TextField,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  MenuItem,
  Typography,
  Chip,
} from "@mui/material";
import { ClipboardList } from "lucide-react";
import { MOCK_AD_USERS } from "../../../data/maritime/masterData";
import type {
  MovementRequest,
  UrgencyOption,
  RequestTypeOption,
  BusinessUnitOption,
} from "../../../types/maritime/logistics";

interface RequestDetailsProps {
  formData: MovementRequest;
  handleFormUpdate: (field: keyof MovementRequest, value: any) => void;
  requestTypes: RequestTypeOption[];
  urgencyOptions: UrgencyOption[];
  businessUnits: BusinessUnitOption[];
}

export const RequestDetails = ({
  formData,
  handleFormUpdate,
  requestTypes,
  urgencyOptions,
  businessUnits,
}: RequestDetailsProps) => {
  return (
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
            onChange={(e) => handleFormUpdate("requestTypeId", e.target.value)}
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
            onChange={(e) => handleFormUpdate("urgencyId", e.target.value)}
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
                  handleFormUpdate("transportationRequired", e.target.checked)
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
            onChange={(e) => handleFormUpdate("costCentre", e.target.value)}
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
  );
};
