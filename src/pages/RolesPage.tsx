import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  ListItemText,
  Checkbox,
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
  ListSubheader,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  CircularProgress,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Shield,
  MoreVertical,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  type Role,
  type MenuItemOption,
  type CreateRoleDto,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getMenuItems,
} from "../services/roleService";
import { LoadingIndicator } from "../components/common/LoadingIndicator";

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<CreateRoleDto>({
    roleName: "",
    description: "",
    menuItemIds: [],
    isActive: true,
  });
  const [statusFilter, setStatusFilter] = useState("All");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rolesData, menuItemsData] = await Promise.all([
        getRoles(),
        getMenuItems(),
      ]);
      setRoles(rolesData);
      setMenuItems(menuItemsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load roles and menu items.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (role?: Role) => {
    if (role) {
      setFormData({
        roleName: role.roleName,
        description: role.description,
        menuItemIds: role.menuItemIds,
        isActive: role.isActive ?? true,
      });
      setEditingRoleId(role.roleId);
      setEditMode(true);
    } else {
      setFormData({
        roleName: "",
        description: "",
        menuItemIds: [],
        isActive: true,
      });
      setEditingRoleId(null);
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editMode && editingRoleId) {
        // Construct the full Role object for update
        const roleToUpdate: Role = {
          roleId: editingRoleId,
          ...formData, // Spread updated fields
        };
        await updateRole(editingRoleId, roleToUpdate);
        toast.success("Role updated successfully");
      } else {
        await createRole(formData);
        toast.success("Role created successfully");
      }
      handleClose();
      fetchData();
    } catch (error) {
      console.error("Failed to save role:", error);
      toast.error("Failed to save role.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        await deleteRole(id);
        toast.success("Role deleted successfully");
        fetchData();
      } catch (error) {
        console.error("Failed to delete role:", error);
        toast.error("Failed to delete role.");
      }
    }
  };

  const handleActionClick = (
    event: React.MouseEvent<HTMLElement>,
    role: Role,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRole(role);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedRole(null);
  };

  const filteredRoles = roles.filter((r) => {
    const matchesSearch = r.roleName
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" ? r.isActive !== false : r.isActive === false);
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
      <RolesHeader onRefresh={fetchData} onAddRole={() => handleOpen()} />

      {isLoading && <LoadingIndicator />}

      <RolesFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <RolesTable
        roles={filteredRoles}
        onActionClick={handleActionClick}
        searchText={searchText}
      />

      <RoleFormDialog
        open={open}
        editMode={editMode}
        formData={formData}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onFormDataChange={setFormData}
        menuItems={menuItems}
        isSaving={isSaving}
      />

      <RoleActionMenu
        anchorEl={anchorEl}
        selectedRole={selectedRole}
        onClose={handleActionClose}
        onEdit={handleOpen}
        onDelete={(role) => handleDelete(role.roleId)}
      />
    </Box>
  );
}

// --- Sub-components ---

interface RolesHeaderProps {
  onRefresh: () => void;
  onAddRole: () => void;
}

const RolesHeader = ({ onRefresh, onAddRole }: RolesHeaderProps) => (
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
        <Shield size={24} color="var(--accent)" />
        Role Management
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Configure roles and menu access permissions
      </Typography>
    </Box>
    <Box sx={{ display: "flex", gap: 1 }}>
      <IconButton
        onClick={onRefresh}
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
        onClick={onAddRole}
        sx={{
          bgcolor: "var(--accent)",
          fontWeight: 700,
          px: 3,
          borderRadius: "8px",
          "&:hover": { bgcolor: "var(--accent)", opacity: 0.9 },
        }}
      >
        Add Role
      </Button>
    </Box>
  </Box>
);

interface RolesFilterBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const RolesFilterBar = ({
  searchText,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: RolesFilterBarProps) => (
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
      placeholder="Search roles..."
      value={searchText}
      onChange={(e) => onSearchChange(e.target.value)}
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
            <Search size={18} color="var(--accent)" style={{ opacity: 0.8 }} />
          </InputAdornment>
        ),
        endAdornment: searchText && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onSearchChange("")}
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
      onChange={(e) => onStatusFilterChange(e.target.value)}
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
            <Filter size={18} color="var(--accent)" style={{ opacity: 0.8 }} />
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
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#10b981",
            }}
          />
          <Typography variant="body2">Active</Typography>
        </Box>
      </MuiMenuItem>
      <MuiMenuItem value="Inactive" sx={{ fontSize: "0.875rem" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#9ca3af",
            }}
          />
          <Typography variant="body2">Inactive</Typography>
        </Box>
      </MuiMenuItem>
    </TextField>
  </Box>
);

interface RolesTableProps {
  roles: Role[];
  onActionClick: (event: React.MouseEvent<HTMLElement>, role: Role) => void;
  searchText: string;
}

const RolesTable = ({ roles, onActionClick, searchText }: RolesTableProps) => (
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
            Role Name
          </TableCell>
          <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
            Description
          </TableCell>
          <TableCell sx={{ color: "var(--text-secondary)", fontWeight: 700 }}>
            Status
          </TableCell>
          <TableCell
            align="right"
            sx={{ color: "var(--text-secondary)", fontWeight: 700 }}
          >
            Menu Access
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
        {roles.map((role) => (
          <TableRow
            key={role.roleId}
            hover
            sx={{
              "&:last-child td, &:last-child th": { border: 0 },
              "&:hover": { bgcolor: "rgba(255,255,255,0.02)" },
            }}
          >
            <TableCell sx={{ color: "var(--text)", fontWeight: 600 }}>
              {role.roleName}
            </TableCell>
            <TableCell sx={{ color: "var(--text)" }}>
              {role.description}
            </TableCell>
            <TableCell>
              <Chip
                label={role.isActive !== false ? "Active" : "Inactive"}
                size="small"
                color={role.isActive !== false ? "success" : "default"}
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  height: 20,
                  px: 0.5,
                }}
              />
            </TableCell>
            <TableCell align="right" sx={{ color: "var(--text)" }}>
              {role.menuItemIds?.length || 0} items
            </TableCell>
            <TableCell align="center">
              <IconButton
                size="small"
                onClick={(e) => onActionClick(e, role)}
                sx={{ color: "var(--muted)" }}
              >
                <MoreVertical size={18} />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
        {roles.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
              <Typography color="text.secondary" variant="body2">
                {searchText
                  ? "No results matching your search."
                  : "No roles found."}
              </Typography>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

interface RoleFormDialogProps {
  open: boolean;
  editMode: boolean;
  formData: CreateRoleDto;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFormDataChange: (data: CreateRoleDto) => void;
  menuItems: MenuItemOption[];
  isSaving: boolean;
}

const RoleFormDialog = ({
  open,
  editMode,
  formData,
  onClose,
  onSubmit,
  onFormDataChange,
  menuItems,
  isSaving,
}: RoleFormDialogProps) => (
  <Dialog
    open={open}
    onClose={onClose}
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
        <Shield size={22} className="text-accent" />
        {editMode ? "Edit Role" : "Add Role"}
      </Box>
      <IconButton onClick={onClose} size="small">
        <X size={20} />
      </IconButton>
    </DialogTitle>
    <form onSubmit={onSubmit}>
      <DialogContent dividers>
        <TextField
          fullWidth
          label="Role Name"
          value={formData.roleName}
          onChange={(e) =>
            onFormDataChange({ ...formData, roleName: e.target.value })
          }
          sx={{ mb: 2 }}
          required
        />
        <TextField
          fullWidth
          label="Description"
          value={formData.description || ""}
          onChange={(e) =>
            onFormDataChange({ ...formData, description: e.target.value })
          }
          sx={{ mb: 3 }}
          multiline
          rows={2}
          required
        />

        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
          Menu Access
        </Typography>
        <Paper variant="outlined" sx={{ maxHeight: 300, overflow: "auto" }}>
          <List dense>
            {Object.entries(
              menuItems.reduce(
                (acc, item) => {
                  const group = item.groupLabel || "Other";
                  if (!acc[group]) acc[group] = [];
                  acc[group].push(item);
                  return acc;
                },
                {} as Record<string, MenuItemOption[]>,
              ),
            ).map(([group, items]) => (
              <React.Fragment key={`group-${group}`}>
                <ListSubheader
                  sx={{
                    bgcolor: "background.paper",
                    fontWeight: "bold",
                    color: "var(--accent)",
                  }}
                >
                  {group}
                </ListSubheader>
                {items.map((item) => {
                  const labelId = `checkbox-list-label-${item.menuItemId}`;
                  return (
                    <ListItem key={item.menuItemId} disablePadding>
                      <ListItemButton
                        role={undefined}
                        onClick={() => {
                          const currentIndex = formData.menuItemIds.indexOf(
                            item.menuItemId,
                          );
                          const newChecked = [...formData.menuItemIds];

                          if (currentIndex === -1) {
                            newChecked.push(item.menuItemId);
                          } else {
                            newChecked.splice(currentIndex, 1);
                          }
                          onFormDataChange({
                            ...formData,
                            menuItemIds: newChecked,
                          });
                        }}
                        dense
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={
                              formData.menuItemIds.indexOf(item.menuItemId) !==
                              -1
                            }
                            tabIndex={-1}
                            disableRipple
                            inputProps={{ "aria-labelledby": labelId }}
                          />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={item.itemLabel} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </React.Fragment>
            ))}
          </List>
        </Paper>
        <Typography
          variant="caption"
          sx={{ mt: 1, display: "block", color: "text.secondary" }}
        >
          {formData.menuItemIds.length} items selected
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={formData.isActive ?? true}
              onChange={(e) =>
                onFormDataChange({ ...formData, isActive: e.target.checked })
              }
            />
          }
          label="Active"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={isSaving}>
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
);

interface RoleActionMenuProps {
  anchorEl: HTMLElement | null;
  selectedRole: Role | null;
  onClose: () => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

const RoleActionMenu = ({
  anchorEl,
  selectedRole,
  onClose,
  onEdit,
  onDelete,
}: RoleActionMenuProps) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
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
        if (selectedRole) onEdit(selectedRole);
        onClose();
      }}
      sx={{ gap: 1.5, fontSize: "0.875rem" }}
    >
      <Edit2 size={16} color="var(--accent)" />
      Edit Role
    </MuiMenuItem>
    <MuiMenuItem
      onClick={() => {
        if (selectedRole) onDelete(selectedRole);
        onClose();
      }}
      sx={{ gap: 1.5, fontSize: "0.875rem", color: "var(--danger)" }}
    >
      <Trash2 size={16} />
      Delete
    </MuiMenuItem>
  </Menu>
);
