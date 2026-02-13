import { createTheme } from "@mui/material";

export const getAppTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#38bdf8" : "#0284c7",
      },
      background: {
        default: mode === "dark" ? "#0b1220" : "#f3f4f6",
        paper: mode === "dark" ? "#020617" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#e5e7eb" : "#1f2937",
        secondary: mode === "dark" ? "#9ca3af" : "#6b7280",
      },
      divider: mode === "dark" ? "#1f2937" : "#d1d5db",
    },
    typography: {
      fontFamily: '"Inter", "system-ui", "-apple-system", sans-serif',
    },
    shape: {
      borderRadius: 6,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            backgroundColor: "var(--panel)",
            border: "1px solid var(--border)",
          },
        },
      },
    },
  });
