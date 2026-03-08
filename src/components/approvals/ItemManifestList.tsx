import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Package, ChevronDown } from "lucide-react";
import type { MovementRequest } from "../../types/maritime/logistics";

interface ItemManifestListProps {
  request: MovementRequest;
}

export function ItemManifestList({ request }: ItemManifestListProps) {
  return (
    <>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Items Manifest
      </Typography>
      <Accordion
        disableGutters
        sx={{
          bgcolor: "transparent",
          boxShadow: "none",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          "&:before": { display: "none" },
          overflow: "hidden",
          mb: 4,
        }}
      >
        <AccordionSummary
          expandIcon={<ChevronDown size={18} />}
          sx={{
            p: 2,
            minHeight: "auto",
            bgcolor: "var(--panel-hover)",
            "& .MuiAccordionSummary-content": { m: 0 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Package size={18} />
            <Typography variant="body2" fontWeight={700}>
              {request.items.length} Item{request.items.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            px: 0,
            py: 0,
            bgcolor: "var(--background)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {request.items.map((item, index) => (
              <Box
                key={item.itemId}
                sx={{
                  p: 2,
                  borderBottom:
                    index < request.items.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                    mb: 0.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    color="var(--accent)"
                  >
                    {item.itemTypeName || "General Cargo"}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="var(--text-secondary)"
                    sx={{ opacity: 0.5 }}
                  >
                    •
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {item.quantity} {item.unitOfMeasurement}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="var(--text-secondary)"
                    sx={{ opacity: 0.5 }}
                  >
                    •
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {item.weight} {item.weightUnit || "t"}
                  </Typography>
                  {item.dimensions && (
                    <>
                      <Typography
                        variant="caption"
                        color="var(--text-secondary)"
                        sx={{ opacity: 0.5 }}
                      >
                        •
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {item.dimensions} {item.dimensionUnit || "cm3"}
                      </Typography>
                    </>
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    display: "block",
                  }}
                >
                  {item.description || "No description provided"}
                </Typography>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  );
}
