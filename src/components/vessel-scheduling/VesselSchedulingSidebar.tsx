import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Home,
  Database,
  Layout,
  Cloud,
  Settings,
  Compass,
  Calendar,
  Map as MapIcon,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const MENU_ITEMS = [
  { text: "Home", icon: Home, path: "/" },
  {
    text: "Data Explorer",
    icon: Database,
    path: "/vessel-scheduling/data-explorer",
  },
  {
    text: "Route Configuration",
    icon: Layout,
    path: "/vessel-scheduling/config",
  },
  { text: "Weather", icon: Cloud, path: "/vessel-scheduling/weather" },
  {
    text: "Optimization Tasks",
    icon: Compass,
    path: "/vessel-scheduling/optimization",
  },
  { text: "Schedule", icon: Calendar, path: "/vessel-scheduling/schedule" },
  { text: "Map", icon: MapIcon, path: "/vessel-scheduling/map" },
  { text: "Settings", icon: Settings, path: "/vessel-scheduling/settings" },
];

export function VesselSchedulingSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box
      sx={{
        width: 260,
        height: "100%",
        borderRight: "1px solid var(--border)",
        bgcolor: "#f8fafc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid var(--border)" }}>
        <Typography
          variant="overline"
          sx={{ color: "var(--muted)", fontWeight: 700, letterSpacing: 1.2 }}
        >
          Views
        </Typography>
      </Box>

      <List sx={{ px: 1, py: 1 }}>
        {MENU_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  "&.Mui-selected": {
                    bgcolor: "var(--primary-soft)",
                    color: "var(--primary)",
                    "& .MuiListItemIcon-root": { color: "var(--primary)" },
                    "&:hover": { bgcolor: "var(--primary-soft)" },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? "var(--primary)" : "var(--muted)",
                  }}
                >
                  <item.icon size={20} />
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
