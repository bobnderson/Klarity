import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  CircularProgress,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Mail,
  Shield,
  Server,
  User,
  Save,
  Lock,
  Send,
  Settings,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

interface SmtpSettings {
  enabled: boolean;
  server: string;
  port: number;
  username: string;
  password?: string;
  enableSsl: boolean;
  senderEmail: string;
  domain: string;
}

export const SmtpSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SmtpSettings>({
    enabled: false,
    server: "",
    port: 587,
    username: "",
    password: "",
    enableSsl: true,
    senderEmail: "",
    domain: "",
  });

  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/settings/smtp");
      setSettings(response.data);
    } catch (error) {
      console.error("Failed to load settings", error);
      toast.error("Failed to load SMTP settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/settings/smtp", settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save SMTP settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.warning("Please enter a target email address");
      return;
    }

    setTesting(true);
    try {
      await api.post("/settings/smtp/test", {
        settings: settings,
        toEmail: testEmail,
      });
      toast.success("Test email sent successfully!");
      setTestDialogOpen(false);
    } catch (error: any) {
      console.error("Failed to send test email", error);
      toast.error(
        error.response?.data ||
          "Failed to send test email. Check your settings.",
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 1000, margin: "0 auto" }}>
      <SmtpHeader />

      <SmtpSettingsCard
        enabled={settings.enabled}
        onEnabledChange={handleChange}
      >
        <SmtpServerConfig
          settings={settings}
          onChange={handleChange}
          disabled={!settings.enabled}
        />

        <Divider sx={{ my: 4, borderColor: "var(--border)" }} />

        <SmtpAuthentication
          settings={settings}
          onChange={handleChange}
          disabled={!settings.enabled}
        />

        <Divider sx={{ my: 4, borderColor: "var(--border)" }} />

        <SmtpSenderConfig
          settings={settings}
          onChange={handleChange}
          disabled={!settings.enabled}
        />

        <Box
          sx={{ mt: 5, display: "flex", justifyContent: "flex-end", gap: 2 }}
        >
          <Button
            variant="outlined"
            size="large"
            startIcon={<Send size={20} />}
            onClick={() => setTestDialogOpen(true)}
            disabled={loading || saving}
            sx={{ px: 3 }}
          >
            Test Configuration
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={
              saving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Save size={20} />
              )
            }
            onClick={handleSave}
            disabled={loading || saving}
            sx={{
              bgcolor: "var(--accent)",
              "&:hover": { bgcolor: "var(--accent)" },
              px: 4,
            }}
          >
            Save Configuration
          </Button>
        </Box>
      </SmtpSettingsCard>

      <SmtpTestEmailDialog
        open={testDialogOpen}
        onClose={() => !testing && setTestDialogOpen(false)}
        testEmail={testEmail}
        onTestEmailChange={setTestEmail}
        onSend={handleTestEmail}
        testing={testing}
      />
    </Box>
  );
};

// --- Sub-components ---

const SmtpHeader = () => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 4,
    }}
  >
    <Box>
      <Typography
        variant="h5"
        fontWeight="600"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <Settings size={22} color="var(--accent)" />
        System Settings
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Configure email notifications and system defaults
      </Typography>
    </Box>
  </Box>
);

interface SmtpSettingsCardProps {
  enabled: boolean;
  onEnabledChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}

const SmtpSettingsCard = ({
  enabled,
  onEnabledChange,
  children,
}: SmtpSettingsCardProps) => (
  <Paper
    elevation={0}
    sx={{
      p: 0,
      bgcolor: "var(--panel)",
      border: "1px solid var(--border)",
      borderRadius: "12px",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        p: 3,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            bgcolor: "var(--accent-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent)",
          }}
        >
          <Mail size={20} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Email Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure SMTP server and notification preferences
          </Typography>
        </Box>
      </Box>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={onEnabledChange}
            name="enabled"
            color="primary"
          />
        }
        label={
          <Typography sx={{ fontWeight: 500 }}>
            {enabled ? "Enabled" : "Disabled"}
          </Typography>
        }
      />
    </Box>
    <Box sx={{ p: 4 }}>{children}</Box>
  </Paper>
);

interface SmtpConfigProps {
  settings: SmtpSettings;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const SmtpServerConfig = ({
  settings,
  onChange,
  disabled,
}: SmtpConfigProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--muted)",
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Server size={14} /> SMTP Server Details
      </Typography>
    </Grid>

    <Grid size={{ xs: 12, md: 8 }}>
      <TextField
        fullWidth
        label="SMTP Server Address"
        name="server"
        value={settings.server}
        onChange={onChange}
        disabled={disabled}
        placeholder="smtp.office365.com"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Server size={18} />
            </InputAdornment>
          ),
        }}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <TextField
        fullWidth
        label="Port"
        name="port"
        type="number"
        value={settings.port}
        onChange={onChange}
        disabled={disabled}
      />
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <FormControlLabel
        control={
          <Switch
            checked={settings.enableSsl}
            onChange={onChange}
            name="enableSsl"
          />
        }
        label="Enable SSL/TLS"
        disabled={disabled}
      />
    </Grid>
  </Grid>
);

const SmtpAuthentication = ({
  settings,
  onChange,
  disabled,
}: SmtpConfigProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--muted)",
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Shield size={14} /> Authentication
      </Typography>
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Username / Email"
        name="username"
        value={settings.username}
        onChange={onChange}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <User size={18} />
            </InputAdornment>
          ),
        }}
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Password"
        name="password"
        type="password"
        value={settings.password}
        onChange={onChange}
        disabled={disabled}
        placeholder={settings.password === "********" ? "********" : ""}
        helperText="Leave blank to keep existing password"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Lock size={18} />
            </InputAdornment>
          ),
        }}
      />
    </Grid>
  </Grid>
);

const SmtpSenderConfig = ({
  settings,
  onChange,
  disabled,
}: SmtpConfigProps) => (
  <Grid container spacing={3}>
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          textTransform: "uppercase",
          color: "var(--muted)",
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Mail size={14} /> Sender Configuration
      </Typography>
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Sender Email Address"
        name="senderEmail"
        value={settings.senderEmail}
        onChange={onChange}
        disabled={disabled}
        placeholder="notifications@klarity.com"
      />
    </Grid>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField
        fullWidth
        label="Default Domain"
        name="domain"
        value={settings.domain}
        onChange={onChange}
        disabled={disabled}
        placeholder="shell.com"
        helperText="Appended to usernames (samAccountName) for email resolution"
      />
    </Grid>
  </Grid>
);

interface SmtpTestEmailDialogProps {
  open: boolean;
  onClose: () => void;
  testEmail: string;
  onTestEmailChange: (email: string) => void;
  onSend: () => void;
  testing: boolean;
}

const SmtpTestEmailDialog = ({
  open,
  onClose,
  testEmail,
  onTestEmailChange,
  onSend,
  testing,
}: SmtpTestEmailDialogProps) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Test SMTP Configuration</DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ mb: 2 }}>
        Enter an email address to receive a test message using the current
        configuration.
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        label="Target Email Address"
        type="email"
        fullWidth
        variant="outlined"
        value={testEmail}
        onChange={(e) => onTestEmailChange(e.target.value)}
        disabled={testing}
      />
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button onClick={onClose} disabled={testing}>
        Cancel
      </Button>
      <Button
        onClick={onSend}
        variant="contained"
        disabled={testing}
        startIcon={
          testing ? <CircularProgress size={16} color="inherit" /> : null
        }
      >
        {testing ? "Sending..." : "Send Test Email"}
      </Button>
    </DialogActions>
  </Dialog>
);
