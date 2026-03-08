import { Grid, TextField, MenuItem } from "@mui/material";
import type { Location } from "../../../types/maritime/logistics";

interface RouteSectionProps {
  origin: string;
  destination: string;
  locations: Location[];
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
}

const inputSx = {
  "& .MuiInputBase-root": { fontSize: "0.875rem" },
  "& .MuiInputLabel-root": { fontSize: "0.875rem" },
};

const menuItemSx = {
  fontSize: "0.875rem",
};

export function RouteSection({
  origin,
  destination,
  locations,
  onOriginChange,
  onDestinationChange,
}: RouteSectionProps) {
  return (
    <>
      <Grid size={{ xs: 6 }}>
        <TextField
          select
          fullWidth
          label="Origin"
          value={origin}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onOriginChange(e.target.value)
          }
          size="small"
          sx={inputSx}
        >
          {locations.map((loc) => (
            <MenuItem
              key={loc.locationId}
              value={loc.locationId}
              sx={menuItemSx}
            >
              {loc.locationName}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={{ xs: 6 }}>
        <TextField
          select
          fullWidth
          label="Destination"
          value={destination}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onDestinationChange(e.target.value)
          }
          size="small"
          sx={inputSx}
        >
          {locations.map((loc) => (
            <MenuItem
              key={loc.locationId}
              value={loc.locationId}
              sx={menuItemSx}
            >
              {loc.locationName}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </>
  );
}
