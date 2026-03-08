import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LoginPage } from "./pages/LoginPage";
import { MovementReqPage } from "./pages/MovementReqPage";
import { MarinePlanner } from "./pages/MarinePlanner";
import { VesselPage } from "./pages/VesselPage";
import { HelicoptersPage } from "./pages/HelicoptersPage";
import { SimulationPage } from "./pages/SimulationPage";
import { CargoManifestPage } from "./pages/CargoManifestPage";
import { AviationDashboardPage } from "./pages/AviationDashboardPage";
import { VesselSchedulingPage } from "./pages/VesselSchedulingPage";
import { SmtpSettings } from "./pages/SmtpSettings";
import { NotificationTemplatesPage } from "./pages/NotificationTemplatesPage";
import { AviationPlanner } from "./pages/AviationPlanner";
import { HelicopterRequestPage } from "./pages/HelicopterRequestPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import AviationApprovalPage from "./pages/Aviation/AviationApprovalPage";
import { ApprovalDashboardPage } from "./pages/ApprovalDashboardPage";
import { MarineApprovalPage } from "./pages/MarineApprovalPage";
import FlightSchedulePage from "./pages/FlightSchedulePage";
import { Topbar } from "./components/common/Topbar";
import { ThemeProvider, useThemeContext } from "./context/ThemeContext";
import { getAppTheme } from "./theme/appTheme";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { useEffect } from "react";
import {
  getUrgencyOptions,
  getUnits,
  getRequestTypes,
  getBusinessUnits,
  getVesselStatuses,
  getVoyageStatuses,
  getItemCategories,
  getItemTypes,
} from "./services/maritime/referenceDataService";
import { getLocations } from "./services/maritime/locationService";
import { getRoutes } from "./services/maritime/routeService";

function AppContent() {
  const { mode } = useThemeContext();
  const theme = getAppTheme(mode);

  // Pre-fetch frequently used reference data on app launch
  useEffect(() => {
    const prefetchData = async () => {
      // We must have a token to fetch protected reference data
      const token = sessionStorage.getItem("auth_token");
      if (!token) {
        return;
      }

      try {
        await Promise.all([
          getUrgencyOptions(),
          getUnits(),
          getRequestTypes(),
          getBusinessUnits(),
          getRoutes(),
          getVesselStatuses(),
          getVoyageStatuses(),
          getLocations(),
          getItemCategories(),
          getItemTypes(),
        ]);
        console.log("Reference data pre-fetched");
      } catch (error) {
        console.error("Failed to pre-fetch reference data", error);
      }
    };
    prefetchData();
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<LoginPage />} />

            {/* Authenticated Routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/*"
                element={
                  <>
                    <Topbar />
                    <Routes>
                      <Route
                        path="/marine-planner"
                        element={<MarinePlanner />}
                      />
                      <Route
                        path="/marine-request"
                        element={<MovementReqPage />}
                      />
                      <Route path="/marine-vessels" element={<VesselPage />} />
                      <Route path="/settings-users" element={<UsersPage />} />
                      <Route path="/settings-roles" element={<RolesPage />} />
                      <Route
                        path="/aviation-request"
                        element={<HelicopterRequestPage />}
                      />
                      <Route
                        path="/aviation-planner"
                        element={<AviationPlanner />}
                      />
                      <Route
                        path="/aviation-dashboard"
                        element={<AviationDashboardPage />}
                      />
                      <Route
                        path="/aviation-helicopters"
                        element={<HelicoptersPage />}
                      />
                      <Route
                        path="/aviation-schedules"
                        element={<FlightSchedulePage />}
                      />
                      <Route
                        path="/marine-simulation"
                        element={<SimulationPage />}
                      />
                      <Route
                        path="/cargo-manifest"
                        element={<CargoManifestPage />}
                      />
                      <Route
                        path="/vessel-scheduling/*"
                        element={<VesselSchedulingPage />}
                      />
                      <Route path="/settings-smtp" element={<SmtpSettings />} />
                      <Route
                        path="/settings-notifications"
                        element={<NotificationTemplatesPage />}
                      />
                      <Route
                        path="/approve-aviation/:requestId"
                        element={<AviationApprovalPage />}
                      />
                      <Route
                        path="/approval-dashboard"
                        element={<ApprovalDashboardPage />}
                      />
                      <Route
                        path="/approve-marine/:requestId"
                        element={<MarineApprovalPage />}
                      />
                    </Routes>
                  </>
                }
              />
            </Route>
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={mode}
          />
        </Router>
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
