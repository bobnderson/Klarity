import React, { useRef } from "react";
import dayjs, { Dayjs } from "dayjs";
import { Box, Typography, Tooltip } from "@mui/material";
import { Ship } from "lucide-react";
import type { Vessel } from "../../types/maritime/marine";
import { CARGO_TYPE_CONFIG } from "../../types/maritime/marine";

interface VoyageTimelineGanttProps {
  vessels: Vessel[];
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onSelectVoyage: (vesselId: string, voyageId: string) => void;
  selectedVoyageId?: string;
}

export function VoyageTimelineGantt({
  vessels,
  startDate,
  endDate,
  onSelectVoyage,
  selectedVoyageId,
}: VoyageTimelineGanttProps) {
  const timelineHeaderRef = useRef<HTMLDivElement>(null);
  const timelineBodyRef = useRef<HTMLDivElement>(null);
  const metadataBodyRef = useRef<HTMLDivElement>(null);

  // Sync horizontal scroll between body and header
  const handleTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (timelineHeaderRef.current) {
      timelineHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Sync vertical scroll between metadata and timeline
  const handleVerticalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target === metadataBodyRef.current && timelineBodyRef.current) {
      timelineBodyRef.current.scrollTop = target.scrollTop;
    } else if (target === timelineBodyRef.current && metadataBodyRef.current) {
      metadataBodyRef.current.scrollTop = target.scrollTop;
    }
  };

  if (!startDate || !endDate) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "var(--muted)" }}>
        Please select a Horizon to view the Gantt chart.
      </Box>
    );
  }

  const daysInRange = endDate.diff(startDate, "day") + 1;
  const dayWidth = 100;
  const timelineWidth = daysInRange * dayWidth;
  const metadataWidth = 380;
  const voyageRowHeight = 44;

  const dateHeaders: Dayjs[] = [];
  for (let i = 0; i < daysInRange; i++) {
    const date = startDate.add(i, "day");
    dateHeaders.push(date);
  }

  const calculatePosition = (dateTime: string | Date) => {
    const dt = dayjs(dateTime);
    const diffHours = dt.diff(startDate, "hour");
    return (diffHours / 24) * dayWidth;
  };

  const calculateWidth = (start: string | Date, end: string | Date) => {
    const s = dayjs(start);
    const e = dayjs(end);
    const diffHours = e.diff(s, "hour");
    return (diffHours / 24) * dayWidth;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        bgcolor: "var(--bg)",
        minWidth: 0,
      }}
    >
      {/* 1. LAYERED HEADER (Non-scrollable Vessel info + Scrollable Dates) */}
      <Box
        sx={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          bgcolor: "rgba(0,0,0,0.03)",
          height: 40,
          flexShrink: 0,
        }}
      >
        {/* Fixed Metadata Headers */}
        <Box
          sx={{
            width: metadataWidth,
            display: "flex",
            alignItems: "center",
            borderRight: "2px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <Box sx={{ width: 140, px: 2 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              Vessel
            </Typography>
          </Box>
          <Box sx={{ width: 120, px: 1 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              Route
            </Typography>
          </Box>
          <Box sx={{ width: 120, px: 1 }}>
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              Schedule
            </Typography>
          </Box>
        </Box>

        {/* Scrollable Timeline Header (Dates) */}
        <Box
          ref={timelineHeaderRef}
          sx={{ flex: 1, overflow: "hidden", display: "flex", minWidth: 0 }}
        >
          <Box sx={{ width: timelineWidth, display: "flex" }}>
            {dateHeaders.map((date, idx) => (
              <Box
                key={idx}
                sx={{
                  width: dayWidth,
                  height: "100%",
                  borderRight: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <Typography
                  sx={{ fontSize: 10, fontWeight: 700, color: "var(--text)" }}
                >
                  {date.format("DD MMM")}
                </Typography>
                <Typography sx={{ fontSize: 8, color: "var(--muted)" }}>
                  {date.format("ddd")}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* 2. LAYERED BODY (Split into two vertical scroll-synced columns) */}
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden", minWidth: 0 }}>
        {/* Left Side: Metadata Body (Vertical scroll ONLY, usually hidden scrollbar) */}
        <Box
          ref={metadataBodyRef}
          onScroll={handleVerticalScroll}
          sx={{
            width: metadataWidth,
            flexShrink: 0,
            overflowY: "auto",
            overflowX: "hidden",
            borderRight: "2px solid var(--border)",
            "&::-webkit-scrollbar": { display: "none" }, // Hide scrollbar to keep it clean
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {vessels.map((vessel) => {
            const rowHeight =
              Math.max(vessel.voyages.length, 1) * voyageRowHeight;
            return (
              <Box
                key={vessel.vesselId}
                sx={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                  minHeight: rowHeight,
                  bgcolor: "var(--panel)",
                }}
              >
                <Box
                  sx={{
                    width: 140,
                    px: 2,
                    py: 1,
                    borderRight: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "flex-start",
                    pt: 2,
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "var(--accent-soft)",
                      p: 0.5,
                      borderRadius: "4px",
                      color: "var(--accent)",
                      display: "flex",
                    }}
                  >
                    <Ship size={14} />
                  </Box>
                  <Typography
                    noWrap
                    sx={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}
                  >
                    {vessel.vesselName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  {vessel.voyages.length > 0 ? (
                    vessel.voyages.map((voyage) => (
                      <Box
                        key={voyage.voyageId}
                        sx={{
                          display: "flex",
                          height: voyageRowHeight,
                          alignItems: "center",
                          "&:not(:last-child)": {
                            borderBottom:
                              "1px solid var(--border-subtle, rgba(255,255,255,0.03))",
                          },
                        }}
                      >
                        <Box sx={{ width: 120, px: 1 }}>
                          <Typography
                            noWrap
                            sx={{
                              fontSize: 10,
                              color: "var(--text)",
                              fontWeight: 500,
                            }}
                          >
                            {voyage.originName ||
                              voyage.originId ||
                              (voyage as any).origin}{" "}
                            →{" "}
                            {voyage.destinationName ||
                              voyage.destinationId ||
                              (voyage as any).destination}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: 120,
                            px: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 8.5,
                              color: "var(--muted)",
                              lineHeight: 1.2,
                            }}
                          >
                            Dep:{" "}
                            {dayjs(voyage.departureDateTime).format(
                              "DD/MM HH:mm",
                            )}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 8.5,
                              color: "var(--muted)",
                              lineHeight: 1.2,
                            }}
                          >
                            ETA: {dayjs(voyage.eta).format("DD/MM HH:mm")}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box
                      sx={{
                        height: voyageRowHeight,
                        display: "flex",
                        alignItems: "center",
                        px: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 10,
                          color: "var(--muted)",
                          fontStyle: "italic",
                        }}
                      >
                        No Voyages
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Right Side: Timeline Body (Both Horizontal and Vertical scroll) */}
        <Box
          ref={timelineBodyRef}
          onScroll={(e) => {
            handleTimelineScroll(e);
            handleVerticalScroll(e);
          }}
          sx={{ flex: 1, overflow: "auto", minWidth: 0 }}
        >
          <Box sx={{ width: timelineWidth, position: "relative" }}>
            {vessels.map((vessel) => (
              <Box
                key={vessel.vesselId}
                sx={{
                  position: "relative",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {/* Background Grid Lines Vertical */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    display: "flex",
                    pointerEvents: "none",
                  }}
                >
                  {dateHeaders.map((date, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        width: dayWidth,
                        height: "100%",
                        borderRight: "1px solid var(--border)",
                        bgcolor: date.isSame(dayjs(), "day")
                          ? "var(--accent-soft)"
                          : idx % 2 === 0
                            ? "rgba(0,0,0,0.005)"
                            : "transparent",
                        opacity: 0.5,
                      }}
                    />
                  ))}
                </Box>

                {/* Voyage Lanes */}
                {vessel.voyages.length > 0 ? (
                  vessel.voyages.map((voyage) => {
                    const left = calculatePosition(voyage.departureDateTime);
                    const width = calculateWidth(
                      voyage.departureDateTime,
                      voyage.eta,
                    );
                    const isSelected = voyage.voyageId === selectedVoyageId;

                    return (
                      <Box
                        key={voyage.voyageId}
                        sx={{
                          height: voyageRowHeight,
                          position: "relative",
                          "&:not(:last-child)": {
                            borderBottom:
                              "1px solid var(--border-subtle, rgba(255,255,255,0.03))",
                          },
                        }}
                      >
                        <Tooltip
                          title={`${voyage.originName || voyage.originId || (voyage as any).origin} → ${voyage.destinationName || voyage.destinationId || (voyage as any).destination}\nDep: ${dayjs(voyage.departureDateTime).format("DD MMM HH:mm")}\nETA: ${dayjs(voyage.eta).format("DD MMM HH:mm")}`}
                          arrow
                        >
                          <Box
                            onClick={() =>
                              onSelectVoyage(
                                vessel.vesselId || "",
                                voyage.voyageId,
                              )
                            }
                            sx={{
                              position: "absolute",
                              left,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: Math.max(width, 4),
                              height: 28,
                              bgcolor: isSelected
                                ? "var(--accent)"
                                : "rgba(2, 132, 199, 0.15)",
                              border: `1px solid var(--accent)`,
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              transition: "all 0.1s",
                              zIndex: isSelected ? 2 : 1,
                              "&:hover": {
                                bgcolor: isSelected
                                  ? "var(--accent)"
                                  : "rgba(2, 132, 199, 0.25)",
                                transform: "translateY(-50%) scale(1.01)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                              },
                            }}
                          >
                            <Box sx={{ display: "flex", gap: 0.25, ml: 0.5 }}>
                              {voyage.cargoDistribution
                                .slice(0, 5)
                                .map((cargo, cIdx) => (
                                  <Box
                                    key={cIdx}
                                    sx={{
                                      width: 3,
                                      height: 12,
                                      borderRadius: "1px",
                                      bgcolor:
                                        CARGO_TYPE_CONFIG[cargo.type]?.color ||
                                        "var(--muted)",
                                    }}
                                  />
                                ))}
                            </Box>
                            {width > 60 && (
                              <Typography
                                noWrap
                                sx={{
                                  fontSize: 9,
                                  ml: 1,
                                  fontWeight: 700,
                                  color: isSelected ? "white" : "var(--accent)",
                                }}
                              >
                                {voyage.originName ||
                                  voyage.originId ||
                                  (voyage as any).origin}
                              </Typography>
                            )}
                          </Box>
                        </Tooltip>
                      </Box>
                    );
                  })
                ) : (
                  <Box sx={{ height: voyageRowHeight }} />
                )}

                {/* Current Time Marker */}
                {dayjs().isAfter(startDate) && dayjs().isBefore(endDate) && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: calculatePosition(dayjs().toISOString()),
                      top: 0,
                      bottom: 0,
                      width: 1.5,
                      bgcolor: "var(--danger)",
                      zIndex: 3,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
