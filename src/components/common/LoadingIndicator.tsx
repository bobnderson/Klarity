import { LinearProgress, Box } from "@mui/material";

export function LoadingIndicator() {
  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <LinearProgress sx={{ height: 2 }} />
    </Box>
  );
}
