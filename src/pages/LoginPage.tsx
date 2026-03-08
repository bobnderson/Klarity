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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Globe } from "lucide-react";
import { login, changePassword } from "../services/authService";
import backgroundImage from "../assets/login-bg.png";
import { toast } from "react-toastify";
import type { User } from "../types/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"sso" | "manual">("sso");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tempUser, setTempUser] = useState<User | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await login(
        loginMode === "manual" ? email : undefined,
        loginMode === "manual" ? password : undefined,
      );
      if (response.status === 200 && response.data) {
        if (response.data.mustChangePassword) {
          setTempUser(response.data);
          setShowChangePassword(true);
        } else {
          navigate("/marine-request");
        }
      } else {
        toast.error("Login failed: Invalid response from server");
      }
    } catch (error: any) {
      console.error("Login error:", error.message);
      toast.error(
        "Login failed: " +
          (error.response?.data?.message ||
            "Invalid credentials or server error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await changePassword(password, newPassword);
      toast.success(
        "Password changed successfully! You can now log in with your new password.",
      );
      setShowChangePassword(false);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Logic: backend sets MustChangePassword=false. We can now proceed or ask them to login again.
      // Usually, we can just log them in now. Let's redirect.
      navigate("/marine-request");
    } catch (error: any) {
      console.error("Password change error:", error.message);
      toast.error(
        "Failed to change password: " +
          (error.response?.data?.message || "Internal server error"),
      );
    } finally {
      // Clear passwords from state for security
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
              display: "flex",
              p: 1.5,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #0ea5e9, #22c55e)",
              color: "white",
              width: "fit-content",
              mx: "auto",
              mb: 2,
            }}
          >
            <Globe size={40} />
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
          <SSOSection
            loading={loading}
            onSSOLogin={handleLogin}
            onSwitchToEmail={() => setLoginMode("manual")}
          />
        ) : (
          <EmailPasswordSection
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            onLogin={handleLogin}
            onBackToSSO={() => {
              setPassword("");
              setLoginMode("sso");
            }}
          />
        )}

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            © 2026 Klarity Solutions. All rights reserved.
          </Typography>
        </Box>
      </Paper>

      <ChangePasswordDialog
        open={showChangePassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        setNewPassword={setNewPassword}
        setConfirmPassword={setConfirmPassword}
        loading={loading}
        onSubmit={handlePasswordChangeSubmit}
        onCancel={() => setShowChangePassword(false)}
      />
    </Box>
  );
}

interface ChangePasswordDialogProps {
  open: boolean;
  newPassword: string;
  confirmPassword: string;
  setNewPassword: (val: string) => void;
  setConfirmPassword: (val: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

const ChangePasswordDialog = ({
  open,
  newPassword,
  confirmPassword,
  setNewPassword,
  setConfirmPassword,
  loading,
  onSubmit,
  onCancel,
}: ChangePasswordDialogProps) => (
  <Dialog open={open} PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}>
    <DialogTitle sx={{ fontWeight: 700 }}>Change Your Password</DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ mb: 3 }}>
        This is your first login. Please choose a secure password to continue.
      </DialogContentText>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
        <TextField
          fullWidth
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          sx={{ borderRadius: "12px" }}
        />
        <TextField
          fullWidth
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ borderRadius: "12px" }}
        />
        <Typography variant="caption" color="text.secondary">
          Password must be at least 12 characters, include uppercase, lowercase,
          number, and special character.
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 3, gap: 1 }}>
      <Button onClick={onCancel} disabled={loading} sx={{ fontWeight: 600 }}>
        Cancel
      </Button>
      <Button
        onClick={onSubmit}
        variant="contained"
        disabled={loading || !newPassword || !confirmPassword}
        sx={{
          bgcolor: "#0f172a",
          "&:hover": { bgcolor: "#1e293b" },
          fontWeight: 600,
          px: 3,
        }}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          "Change Password"
        )}
      </Button>
    </DialogActions>
  </Dialog>
);

// --- Sub-components ---

interface SSOSectionProps {
  loading: boolean;
  onSSOLogin: () => void;
  onSwitchToEmail: () => void;
}

const SSOSection = ({
  loading,
  onSSOLogin,
  onSwitchToEmail,
}: SSOSectionProps) => (
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
      onClick={onSSOLogin}
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
          background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
          transform: "translateY(-1px)",
        },
        "&.Mui-disabled": {
          background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
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
      <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
        OR USE CREDENTIALS
      </Typography>
    </Divider>

    <Button
      variant="outlined"
      fullWidth
      onClick={onSwitchToEmail}
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
);

interface EmailPasswordSectionProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  loading: boolean;
  onLogin: () => void;
  onBackToSSO: () => void;
}

const EmailPasswordSection = ({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  onLogin,
  onBackToSSO,
}: EmailPasswordSectionProps) => (
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
      onClick={onLogin}
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
      onClick={onBackToSSO}
      sx={{
        color: "#0284c7",
        fontWeight: 600,
        textTransform: "none",
      }}
    >
      Back to SSO
    </Button>
  </Box>
);
