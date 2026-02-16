import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  FormControlLabel,
  Switch,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Menu,
  MenuItem as MuiMenuItem,
  OutlinedInput,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Users,
  MoreVertical,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  type User,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  searchAdUsers,
  type AdUser,
} from "../services/userService";
import { LoadingIndicator } from "../components/common/LoadingIndicator";
import { type Role, getRoles } from "../services/roleService";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<User>({
    accountId: "",
    accountName: "",
    isActive: true, // Default to true
    roleIds: [],
  });

  const [adOptions, setAdOptions] = useState<AdUser[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [adInputValue, setAdInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (adInputValue.length < 3) {
        setAdOptions([]);
        return;
      }

      setAdLoading(true);
      try {
        const results = await searchAdUsers(adInputValue);
        setAdOptions(results);
      } catch (error) {
        console.error("Failed to search AD users", error);
        setAdOptions([]);
      } finally {
        setAdLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [adInputValue]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        getUsers(),
        getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load users and roles.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (user?: User) => {
    if (user) {
      setFormData(user);
      setEditMode(true);
    } else {
      setFormData({
        accountId: "",
        accountName: "",
        isActive: true, // Default to true
        roleIds: [],
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editMode) {
        await updateUser(formData.accountId, formData);
        toast.success("User updated successfully");
      } else {
        await createUser(formData);
        toast.success("User created successfully");
      }
      handleClose();
      fetchData();
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error("Failed to save user.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setUserToDeleteId(id);
    setDeleteConfirmationOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDeleteId) return;

    try {
      await deleteUser(userToDeleteId);
      toast.success("User deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user.");
    } finally {
      setDeleteConfirmationOpen(false);
      setUserToDeleteId(null);
    }
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLElement>,
    user: User,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.accountName.toLowerCase().includes(searchText.toLowerCase()) ||
      u.accountId.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? u.isActive : !u.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <Box
      sx={{
        p: 4,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
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
            <Users size={24} color="var(--accent)" />
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system users and their access permissions
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            onClick={fetchData}
            sx={{
              bgcolor: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-secondary)",
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.05)",
                color: "var(--accent)",
              },
            }}
          >
            <RefreshCw size={18} />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpen()}
            sx={{
              bgcolor: "var(--accent)",
              fontWeight: 700,
              px: 3,
              borderRadius: "8px",
              "&:hover": { bgcolor: "var(--accent)", opacity: 0.9 },
            }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {isLoading && <LoadingIndicator />}

      {/* Search & Filter Bar */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          p: 1.5,
          bgcolor: "var(--panel)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          alignItems: "center",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            borderColor: "rgba(255, 178, 0, 0.3)",
          },
        }}
      >
        <TextField
          size="small"
          placeholder="Search items..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "transparent" },
              "&.Mui-focused fieldset": {
                borderColor: "var(--accent)",
                opacity: 0.5,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1.5 }}>
                <Search
                  size={18}
                  color="var(--accent)"
                  style={{ opacity: 0.8 }}
                />
              </InputAdornment>
            ),
            endAdornment: searchText && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchText("")}
                  sx={{
                    color: "var(--muted)",
                    "&:hover": { color: "var(--danger)" },
                  }}
                >
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box
          sx={{
            width: "1px",
            height: "24px",
            bgcolor: "var(--border)",
            mx: 1,
          }}
        />

        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{
            width: 180,
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255,255,255,0.02)",
              borderRadius: "8px",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "transparent" },
              "&.Mui-focused fieldset": {
                borderColor: "var(--accent)",
                opacity: 0.5,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <Filter
                  size={18}
                  color="var(--accent)"
                  style={{ opacity: 0.8 }}
                />
              </InputAdornment>
            ),
          }}
        >
          <MuiMenuItem value="All" sx={{ fontSize: "0.875rem" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2">All Statuses</Typography>
            </Box>
          </MuiMenuItem>
          <MuiMenuItem value="Active" sx={{ fontSize: "0.875rem" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{ w: 8, h: 8, borderRadius: "50%", bgcolor: "#10b981" }}
              />
              <Typography variant="body2">Active</Typography>
            </Box>
          </MuiMenuItem>
          <MuiMenuItem value="Inactive" sx={{ fontSize: "0.875rem" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{ w: 8, h: 8, borderRadius: "50%", bgcolor: "#9ca3af" }}
              />
              <Typography variant="body2">Inactive</Typography>
            </Box>
          </MuiMenuItem>
        </TextField>
      </Box>

      {/* Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          bgcolor: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 2,
          flex: 1,
          overflow: "auto",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
              <TableCell
                sx={{
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  py: 2,
                }}
              >
                Account ID
              </TableCell>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Account Name
              </TableCell>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Roles
              </TableCell>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Last Login
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.accountId}
                hover
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
                }}
              >
                <TableCell sx={{ color: "var(--text)", fontWeight: 600 }}>
                  {user.accountId}
                </TableCell>
                <TableCell sx={{ color: "var(--text)" }}>
                  {user.accountName}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {user.roleIds && user.roleIds.length > 0 ? (
                      user.roleIds.map((roleId) => {
                        const role = roles.find((r) => r.roleId === roleId);
                        return (
                          <Chip
                            key={roleId}
                            label={role ? role.roleName : roleId}
                            size="small"
                            sx={{ height: 24 }}
                          />
                        );
                      })
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={user.isActive ? "success" : "default"}
                    variant="outlined"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.65rem",
                      height: 20,
                      px: 0.5,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: "var(--text)" }}>
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleActionClick(e, user)}
                    sx={{ color: "var(--muted)" }}
                  >
                    <MoreVertical size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary" variant="body2">
                    {searchText
                      ? "No results matching your search."
                      : "No users found."}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal Form */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderLeft: "6px solid var(--accent)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Users size={22} className="text-accent" />
            {editMode ? "Edit User" : "Add User"}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Autocomplete
              fullWidth
              disabled={editMode}
              options={adOptions}
              loading={adLoading}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.samAccountName
              }
              filterOptions={(x) => x} // Disable built-in filtering to use server-side results
              inputValue={adInputValue}
              onInputChange={(_, newInputValue) => {
                setAdInputValue(newInputValue);
                // Also update form data if user manually types (fallback)
                if (!editMode) {
                  setFormData({ ...formData, accountId: newInputValue });
                }
              }}
              onChange={(_, newValue) => {
                if (newValue && typeof newValue !== "string") {
                  setFormData({
                    ...formData,
                    accountId: newValue.samAccountName,
                    accountName: newValue.displayName,
                  });
                } else if (newValue === null) {
                  // Clear if cleared
                  setFormData({
                    ...formData,
                    accountId: "",
                  });
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Account ID (Search AD)"
                  required
                  sx={{ mb: 2 }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <React.Fragment>
                        {adLoading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </React.Fragment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={key} {...otherProps}>
                    <Box>
                      <Typography variant="body1">
                        {option.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.samAccountName} • {option.email}
                      </Typography>
                    </Box>
                  </li>
                );
              }}
            />
            <TextField
              fullWidth
              label="Account Name"
              value={formData.accountName}
              InputProps={{
                readOnly: true,
              }}
              sx={{ mb: 2, bgcolor: "rgba(0, 0, 0, 0.03)" }} // Visual cue for read-only
              required
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={formData.roleIds}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    roleIds:
                      typeof value === "string" ? value.split(",") : value,
                  });
                }}
                input={<OutlinedInput label="Roles" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={
                          roles.find((r) => r.roleId === value)?.roleName ||
                          value
                        }
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {roles.map((role) => (
                  <MenuItem key={role.roleId} value={role.roleId}>
                    <Checkbox
                      checked={formData.roleIds.indexOf(role.roleId) > -1}
                    />
                    <ListItemText primary={role.roleName} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
              sx={{ mb: 3 }}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={
                isSaving ? <CircularProgress size={20} color="inherit" /> : null
              }
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
        PaperProps={{
          sx: {
            bgcolor: "var(--panel)",
            border: "1px solid var(--border)",
            minWidth: 160,
          },
        }}
      >
        <MuiMenuItem
          onClick={() => {
            if (selectedUser) handleOpen(selectedUser);
            handleActionClose();
          }}
          sx={{ gap: 1.5, fontSize: "0.875rem" }}
        >
          <Edit2 size={16} color="var(--accent)" />
          Edit User
        </MuiMenuItem>
        <MuiMenuItem
          onClick={() => {
            if (selectedUser) confirmDelete(selectedUser.accountId);
            handleActionClose();
          }}
          sx={{ gap: 1.5, fontSize: "0.875rem", color: "var(--danger)" }}
        >
          <Trash2 size={16} />
          Delete
        </MuiMenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this user? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmationOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
