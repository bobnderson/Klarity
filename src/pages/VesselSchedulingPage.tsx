import { Box } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import { VesselSchedulingSidebar } from "../components/vessel-scheduling/VesselSchedulingSidebar";
import { ScheduleView } from "../components/vessel-scheduling/ScheduleView";
import { DataExplorerView } from "../components/vessel-scheduling/DataExplorerView";

export function VesselSchedulingPage() {
  return (
    <Box
      sx={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}
    >
      <VesselSchedulingSidebar />
      <Box sx={{ flex: 1, overflowY: "auto", bgcolor: "var(--bg-app)" }}>
        <Routes>
          <Route path="/" element={<Navigate to="schedule" replace />} />
          <Route path="schedule" element={<ScheduleView />} />
          <Route path="data-explorer" element={<DataExplorerView />} />
          <Route path="*" element={<ScheduleView />} />
        </Routes>
      </Box>
    </Box>
  );
}
