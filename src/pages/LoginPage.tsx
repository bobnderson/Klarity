import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Globe } from "lucide-react";
import { login } from "../services/authService";
import backgroundImage from "../assets/login-bg.png";
import { toast } from "react-toastify";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"sso" | "manual">("sso");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await login(
        loginMode === "manual" ? email : undefined,
        loginMode === "manual" ? password : undefined,
      );
      if (response.status === 200 && response.data) {
        navigate("/marine-request");
      } else {
        toast.error("Login failed: Invalid response from server");
      }
    } catch (error: any) {
      console.error("Login error", error);
      toast.error(
        "Login failed: " +
          (error.response?.data?.message || error.message || "Unauthorized"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f0f4f8",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "brightness(0.98)",
          zIndex: 0,
        }}
      />
      {/* Subtle Overlay Layer */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(240, 244, 248, 0.4)",
          zIndex: 1,
        }}
      />

      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 5 },
          width: "100%",
          maxWidth: 420,
          zIndex: 2,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "24px",
          display: "flex",
          flexDirection: "column",
          gap: 3.5,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              p: 1.5,
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
              color: "white",
              mb: 2,
              boxShadow: "0 8px 16px -4px rgba(14, 165, 233, 0.4)",
            }}
          >
            <Globe size={32} />
          </Box>
          <Typography
            variant="h4"
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
          <Typography
            variant="body2"
            sx={{ color: "#64748b", fontWeight: 500, mt: 0.5 }}
          >
            Integrated Logistics Services
          </Typography>
        </Box>

        {loginMode === "sso" ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={
                loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ShieldCheck size={20} />
                )
              }
              onClick={handleLogin}
              disabled={loading}
              sx={{
                py: 1.8,
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: 700,
                textTransform: "none",
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                boxShadow: "0 10px 15px -3px rgba(2, 132, 199, 0.3)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
                  transform: "translateY(-1px)",
                },
                "&.Mui-disabled": {
                  background:
                    "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
                  color: "rgba(255,255,255,0.7)",
                },
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {loading ? "Signing in..." : "Sign in with Corporate SSO"}
            </Button>

            <Divider
              sx={{
                my: 1,
                "&::before, &::after": { borderColor: "rgba(0,0,0,0.06)" },
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "#94a3b8", fontWeight: 600 }}
              >
                OR USE CREDENTIALS
              </Typography>
            </Divider>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => setLoginMode("manual")}
              sx={{
                py: 1.2,
                borderRadius: "10px",
                borderColor: "#e2e8f0",
                color: "#475569",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#cbd5e1",
                  bgcolor: "rgba(0,0,0,0.02)",
                },
              }}
            >
              Sign in with Email
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              label="Email Address"
              placeholder="name@company.com"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.4)",
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.4)",
                },
              }}
            />
            <Button
              variant="contained"
              fullWidth
              startIcon={
                loading ? <CircularProgress size={18} color="inherit" /> : null
              }
              onClick={handleLogin}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: "12px",
                background: "#0f172a",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
            <Button
              variant="text"
              onClick={() => setLoginMode("sso")}
              sx={{
                color: "#0284c7",
                fontWeight: 600,
                textTransform: "none",
              }}
            >
              Back to SSO
            </Button>
          </Box>
        )}

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            © 2026 Klarity Solutions. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
