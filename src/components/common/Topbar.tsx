import { useState, useEffect } from "react";
import type { User } from "../../types/auth";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  IconButton,
} from "@mui/material";
import { ChevronDown, Sun, Moon, Globe } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

import { logout } from "../../services/authService";
import { useThemeContext } from "../../context/ThemeContext";

export function Topbar() {
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Hide Topbar on login page
  const isLoginPage = location.pathname === "/login";

  useEffect(() => {
    if (isLoginPage) return;

    const storedUser = sessionStorage.getItem("user_data");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/login");
    }
  }, [navigate, isLoginPage]);

  if (isLoginPage) return null;

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLButtonElement>,
    menuLabel: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveMenu(menuLabel);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActiveMenu(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate("/login");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "var(--panel)",
        borderBottom: "1px solid var(--border)",
        height: 64,
      }}
    >
      <Toolbar
        sx={{
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          px: 3,
        }}
      >
        {/* Left Side: Logo & Nav */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              cursor: "pointer",
            }}
            onClick={() => navigate("/marine-request")}
          >
            <Box
              sx={{
                display: "flex",
                p: 0.8,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
                color: "white",
              }}
            >
              <Globe size={18} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
                backgroundClip: "text",
                textFillColor: "transparent",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.5px",
              }}
            >
              Klarity
            </Typography>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {user?.menus?.map((menu) => (
              <Box key={menu.label}>
                <Button
                  onClick={(e) => handleMenuOpen(e, menu.label)}
                  endIcon={
                    menu.children ? <ChevronDown size={14} /> : undefined
                  }
                  sx={{
                    color:
                      activeMenu === menu.label
                        ? "var(--text)"
                        : "var(--text-secondary)",
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    "&:hover": {
                      color: "var(--text)",
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  {menu.label}
                </Button>
                {menu.children && (
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && activeMenu === menu.label}
                    onClose={handleMenuClose}
                    MenuListProps={{
                      sx: {
                        bgcolor: "var(--panel)",
                        border: "1px solid var(--border)",
                        padding: 0.5,
                        minWidth: 180,
                      },
                    }}
                    sx={{
                      "& .MuiPaper-root": {
                        bgcolor: "transparent",
                        backgroundImage: "none",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        mt: 1,
                      },
                    }}
                  >
                    {menu.children.map((child, idx) => (
                      <Box key={child.label}>
                        {idx > 0 &&
                          menu.label === "Maritime" &&
                          child.label === "Movement Request" && (
                            <Divider
                              sx={{ my: 0.5, borderColor: "var(--border)" }}
                            />
                          )}
                        <MenuItem
                          onClick={() =>
                            child.path && handleNavigation(child.path)
                          }
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "var(--text-secondary)",
                            borderRadius: 1,
                            "&:hover": {
                              bgcolor: "rgba(255,255,255,0.05)",
                              color: "var(--text)",
                            },
                          }}
                        >
                          {child.label}
                        </MenuItem>
                      </Box>
                    ))}
                  </Menu>
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Center/Right alignment filler */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Toggle */}
        <IconButton
          onClick={toggleTheme}
          sx={{
            mr: 2,
            color: "var(--text-secondary)",
            bgcolor: "rgba(255, 255, 255, 0.05)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.1)",
              color: "var(--text)",
            },
            transition: "all 0.2s",
            width: 36,
            height: 36,
          }}
          size="small"
        >
          {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>

        {/* Right Side: User Profile */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            cursor: "pointer",
          }}
          onClick={handleUserMenuOpen}
        >
          <Box
            sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}
          >
            <Typography
              sx={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
            >
              {user ? user.accountName : "Loading..."}
            </Typography>
            <Typography sx={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {user && user.roles && user.roles.length > 0
                ? `${user.roles[0].roleName}${user.roles.length > 1 ? ` +${user.roles.length - 1}` : ""}`
                : ""}
            </Typography>
          </Box>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: "var(--accent)",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
            }}
          >
            {user ? getInitials(user.accountName) : ""}
          </Avatar>
        </Box>
        <Menu
          anchorEl={userMenuAnchorEl}
          open={Boolean(userMenuAnchorEl)}
          onClose={handleUserMenuClose}
          MenuListProps={{
            sx: {
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              padding: 0.5,
              minWidth: 150,
            },
          }}
          sx={{
            "& .MuiPaper-root": {
              bgcolor: "transparent",
              backgroundImage: "none",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              mt: 1,
            },
          }}
        >
          <MenuItem
            onClick={handleLogout}
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--danger)",
              borderRadius: 1,
              "&:hover": {
                bgcolor: "rgba(248, 113, 113, 0.1)",
                color: "var(--danger)",
              },
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
