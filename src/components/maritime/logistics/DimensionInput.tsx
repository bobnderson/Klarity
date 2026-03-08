import React, { useRef } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";

interface DimensionInputProps {
  value: string; // "LxWxH"
  onChange: (value: string) => void;
  error?: boolean;
  label?: string;
}

export const DimensionInput = ({
  value,
  onChange,
  error,
  label,
}: DimensionInputProps) => {
  const parts = (value || "").split("x").map((p) => p.trim());
  const l = parts[0] || "";
  const w = parts[1] || "";
  const h = parts[2] || "";

  const lRef = useRef<HTMLInputElement>(null);
  const wRef = useRef<HTMLInputElement>(null);
  const hRef = useRef<HTMLInputElement>(null);

  const updatePart = (index: number, newVal: string) => {
    // Only allow numbers and decimal point
    const sanitized = newVal.replace(/[^0-9.]/g, "");
    // Ensure only one dot
    const dots = sanitized.split(".").length - 1;
    if (dots > 1) return;

    const newParts = [l, w, h];
    newParts[index] = sanitized;
    onChange(newParts.join("x"));
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && index === 1 && !w) {
      lRef.current?.focus();
    } else if (e.key === "Backspace" && index === 2 && !h) {
      wRef.current?.focus();
    } else if (e.key === "x" || e.key === "X" || e.key === "Enter") {
      e.preventDefault();
      if (index === 0) wRef.current?.focus();
      if (index === 1) hRef.current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("Text");
    if (pastedData.includes("x") || pastedData.includes("X")) {
      e.preventDefault();
      const newParts = pastedData
        .split(/[xX]/)
        .map((p) => p.trim().replace(/[^0-9.]/g, ""));
      if (newParts.length > 0) {
        onChange(newParts.slice(0, 3).join("x"));
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "inherit",
    fontSize: "0.875rem",
    textAlign: "center",
    padding: 0,
  };

  return (
    <FormControl
      fullWidth
      variant="outlined"
      size="small"
      error={error}
      className="compact-form-field"
    >
      {label && <InputLabel shrink>{label}</InputLabel>}
      <OutlinedInput
        label={label}
        notched={!!label}
        sx={{
          height: "38.5px", // Match exact Material UI small height
          bgcolor: "transparent",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.23)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.87)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--accent)", // Keep accent for focus
            borderWidth: "2px",
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d32f2f", // Standard MUI error color
          },
          "& .MuiOutlinedInput-input": {
            display: "none",
          },
        }}
        startAdornment={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}
          >
            <input
              ref={lRef}
              value={l}
              placeholder="L"
              onChange={(e) => updatePart(0, e.target.value)}
              onKeyDown={(e) => handleKeyDown(0, e) as any}
              onPaste={handlePaste}
              style={inputStyle}
            />
            <Typography
              variant="caption"
              sx={{ color: "var(--muted)", px: 0.5, opacity: 0.5 }}
            >
              x
            </Typography>
            <input
              ref={wRef}
              value={w}
              placeholder="W"
              onChange={(e) => updatePart(1, e.target.value)}
              onKeyDown={(e) => handleKeyDown(1, e) as any}
              onPaste={handlePaste}
              style={inputStyle}
            />
            <Typography
              variant="caption"
              sx={{ color: "var(--muted)", px: 0.5, opacity: 0.5 }}
            >
              x
            </Typography>
            <input
              ref={hRef}
              value={h}
              placeholder="H"
              onChange={(e) => updatePart(2, e.target.value)}
              onKeyDown={(e) => handleKeyDown(2, e) as any}
              onPaste={handlePaste}
              style={inputStyle}
            />
          </Box>
        }
      />
    </FormControl>
  );
};
