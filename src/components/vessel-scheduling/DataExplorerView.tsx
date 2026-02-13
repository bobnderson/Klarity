import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  TextField,
} from "@mui/material";
import { Edit2, Save, X } from "lucide-react";
import { useState } from "react";
import { MED_PLATFORMS } from "../../data/maritime/schedulingScenarios";

export function DataExplorerView() {
  const [platforms] = useState(MED_PLATFORMS);
  const [editId, setEditId] = useState<string | null>(null);

  const handleEdit = (id: string) => setEditId(id);
  const handleCancel = () => setEditId(null);

  return (
    <Box sx={{ p: 4, bgcolor: "#f8fafc", minHeight: "100%" }}>
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Data Explorer
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage platforms, vessels, and port configurations
          </Typography>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #e2e8f0", borderRadius: 2 }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "#f1f5f9" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Platform Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Visit Frequency</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Zone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Coordinates</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {platforms.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                <TableCell>
                  <Chip
                    label={p.type}
                    size="small"
                    sx={{
                      bgcolor: p.type === "Drilling" ? "#fef3c7" : "#dcfce7",
                      color: p.type === "Drilling" ? "#92400e" : "#166534",
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <TextField
                      size="small"
                      defaultValue={p.frequency}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body2">{p.frequency}</Typography>
                  )}
                </TableCell>
                <TableCell>{p.zone}</TableCell>
                <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>
                  {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                </TableCell>
                <TableCell align="right">
                  {editId === p.id ? (
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={handleCancel}
                      >
                        <Save size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancel}>
                        <X size={16} />
                      </IconButton>
                    </Box>
                  ) : (
                    <IconButton size="small" onClick={() => handleEdit(p.id)}>
                      <Edit2 size={16} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
