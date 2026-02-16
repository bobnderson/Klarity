import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AviationHeader } from "../components/maritime/AviationHeader";
import { VoyageTimeline } from "../components/maritime/VoyageTimeline";
import { HelicopterLayout } from "../components/maritime/HelicopterLayout";
import { InsightsActions } from "../components/maritime/InsightsActions";
import { RequestQueue } from "../components/maritime/RequestQueue";
import { CARGO_TYPE_CONFIG } from "../types/maritime/marine";
import type { Helicopter } from "../types/maritime/marine";
import type { Flight } from "../types/aviation/flight";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { MovementRequest } from "../types/maritime/logistics";

dayjs.extend(isoWeek);

import { getHelicopters } from "../services/maritime/helicopterService";
import {
  getFlights,
  getFlightsByDateRange,
  assignItemsToFlight,
  createFlight,
} from "../services/maritime/flightService";
import { getPendingRequests } from "../services/maritime/marineMovementService";
import { optimizeVoyagePlan } from "../services/maritime/voyageService";
import type {
  RecommendationSummary,
  VoyageRecommendation,
} from "../services/maritime/recommendationService";
import { toast } from "react-toastify";
import { LoadingIndicator } from "../components/common/LoadingIndicator";

export function AviationPlanner() {
  const [vessels, setVessels] = useState<
    (Helicopter & { voyages: Flight[] })[]
  >([]);
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>([]);
  const [routeFilters, setRouteFilters] = useState<
    Array<{ origin: string | null; destination: string | null }>
  >([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string>("");
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("isoWeek"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    dayjs().endOf("isoWeek"),
  );
  const [pendingRequests, setPendingRequests] = useState<MovementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    console.log("AviationPlanner: Starting fetchData...");
    setIsLoading(true);
    try {
      console.log(
        "AviationPlanner: Calling getVessels, getFlights, getPendingRequests...",
      );
      const results = await Promise.allSettled([
        getHelicopters(), // Filter not needed for dedicated service
        getFlights(), // Now calling flights endpoint
        getPendingRequests({ mode: "Aviation" }), // Filter for Aviation requests
      ]);

      const vesselsResult = results[0];
      const flightsResult = results[1];
      const pendingResult = results[2];

      if (vesselsResult.status === "rejected") {
        console.error(
          "AviationPlanner: getVessels failed",
          vesselsResult.reason,
        );
        toast.error("Failed to load helicopters");
      }
      if (flightsResult.status === "rejected") {
        console.error(
          "AviationPlanner: getFlights failed",
          flightsResult.reason,
        );
        toast.error("Failed to load flights");
      }
      if (pendingResult.status === "rejected") {
        console.error(
          "AviationPlanner: getPendingRequests failed",
          pendingResult.reason,
        );
        toast.error("Failed to load pending requests");
      }

      const vesselsData =
        vesselsResult.status === "fulfilled" ? vesselsResult.value : [];
      const flightsData =
        flightsResult.status === "fulfilled" ? flightsResult.value : [];
      const pendingQueueData =
        pendingResult.status === "fulfilled" ? pendingResult.value : [];

      console.log(
        `AviationPlanner: Data received. Helicopters: ${vesselsData.length}, Flights: ${flightsData.length}, Pending: ${pendingQueueData.length}`,
      );

      const vesselsWithFlights = vesselsData.map((vessel: Helicopter) => ({
        ...vessel,
        vesselId: vessel.helicopterId,
        vesselName: vessel.helicopterName,
        voyages: flightsData.filter(
          (f) => f.helicopterId === vessel.helicopterId,
        ),
        capacities: {
          deadWeight: vessel.availablePayloadLb
            ? vessel.availablePayloadLb / 2204.62
            : 2.0, // Convert lb to tonnes
          deckArea: 10, // Placeholder for cabin area
        },
      }));

      setVessels(vesselsWithFlights);
      setSelectedVesselIds(
        vesselsWithFlights
          .map((v) => v.helicopterId)
          .filter(Boolean) as string[],
      );
      setPendingRequests(pendingQueueData);

      // Select first flight if available
      const firstFlight = vesselsWithFlights.flatMap((v) => v.voyages)[0];
      if (firstFlight && !selectedFlightId) {
        setSelectedFlightId(firstFlight.flightId);
      }
    } catch (error) {
      console.error("AviationPlanner: Unexpected error in fetchData", error);
      toast.error("Failed to load dashboard data: " + error);
    } finally {
      setIsLoading(false);
      console.log("AviationPlanner: fetchData finished.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyDateRange = async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      // NOTE: getFlightsByDateRange might need mode filter too?
      // Currently it returns all. Let's filter client side or update API later.
      // For now, I'll rely on the fact that we map flights to known helicopters.
      const flightsData = await getFlightsByDateRange(
        startDate.toISOString(),
        endDate.toISOString(),
      );

      setVessels((prevVessels) =>
        prevVessels.map((vessel) => ({
          ...vessel,
          vesselId: vessel.helicopterId,
          vesselName: vessel.helicopterName,
          voyages: flightsData.filter(
            (f) => f.helicopterId === vessel.helicopterId,
          ),
        })),
      );
      toast.success("Flights filtered by date range");
    } catch (error) {
      toast.error("Failed to filter flights: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropRequestOnFlight = (
    requestId: string,
    flightId: string,
    vesselId: string,
  ) => {
    const request = pendingRequests.find((r) => r.requestId === requestId);
    const vessel = vessels.find((v) => v.helicopterId === vesselId);
    const flight = vessel?.voyages.find((f) => f.flightId === flightId);

    if (!request || !flight || !vessel) {
      toast.error("Invalid assignment target");
      return;
    }

    // 0. Route Validation
    if (
      request.originId !== flight.originId &&
      request.originName !== flight.originName
    ) {
      // Small allowance for comparing ID or Name since Flight might have labels
    }

    if (
      request.destinationId !== flight.destinationId &&
      request.destinationName !== flight.destinationName
    ) {
      toast.error(
        `Route Mismatch: Request is ${request.originName || request.originId} → ${request.destinationName || request.destinationId}, but flight is ${flight.originName || flight.originId} → ${flight.destinationName || flight.destinationId}`,
      );
      return;
    }

    // 1. Schedule Validation
    // Flight Dep must be >= Request Earliest Dep
    // Flight Arrival must be <= Request Latest Arrival
    const vDep = dayjs(flight.departureDateTime);
    const vArrival = dayjs(flight.arrivalDateTime);
    const rStart = dayjs(request.earliestDeparture);
    const rEnd = dayjs(request.latestArrival);

    if (vDep.isBefore(rStart)) {
      toast.error(
        `Schedule Conflict: Request ready at ${rStart.format("DD MMM HH:mm")}, but flight departs at ${vDep.format("DD MMM HH:mm")}`,
      );
      return;
    }
    if (vArrival.isAfter(rEnd)) {
      toast.error(
        `Schedule Conflict: Flight arrives at ${vArrival.format("DD MMM HH:mm")}, which is after the request deadline of ${rEnd.format("DD MMM HH:mm")}`,
      );
      return;
    }

    // 2. Capacity Validation
    const vesselCap = vessel.capacities;
    if (!vesselCap) {
      toast.error("Helicopter capacity data missing");
      return;
    }

    // Parse area from dimension string (e.g. "12m x 6m")
    const dimString = request.dimension || "0x0";
    const dimParts = dimString.toLowerCase().replace(/m/g, "").split("x");
    const reqArea =
      dimParts.length === 2
        ? parseFloat(dimParts[0]) * parseFloat(dimParts[1])
        : 0;
    const reqWeight = request.totalWeight || 0;

    const usedArea = (flight.cabinUtil / 100) * vesselCap.deckArea;
    const usedWeight = (flight.payloadUtil / 100) * vesselCap.deadWeight;

    if (usedArea + reqArea > vesselCap.deckArea) {
      toast.error(
        `Cabin Space Exceeded: Flight needs ${reqArea.toFixed(1)}m² more, but only ${(vesselCap.deckArea - usedArea).toFixed(1)}m² is available.`,
      );
      return;
    }
    if (usedWeight + reqWeight > vesselCap.deadWeight) {
      toast.error(
        `Payload Exceeded: Request is ${reqWeight.toFixed(1)}t, but helicopter only has ${(vesselCap.deadWeight - usedWeight).toFixed(1)}t available.`,
      );
      return;
    }

    // 3. Success - Call Service
    // Collect all item IDs for the request
    const itemIds = request.items.map((i) => i.itemId);

    assignItemsToFlight(flightId, itemIds)
      .then(({ success }: { success: boolean }) => {
        if (success) {
          // Remove from pending
          setPendingRequests((prev) =>
            prev.filter((r) => r.requestId !== requestId),
          );

          // Trigger a refresh to get updated vessel/flight data (simpler than manual calculation for now)
          fetchData();

          toast.success(
            `Request ${requestId} assigned to ${vessel.helicopterName} (${flight.originName || flight.originId} → ${flight.destinationName || flight.destinationId})`,
          );
        }
      })
      .catch(() => {
        toast.error("Failed to assign request");
      });
  };

  const handleAcceptRecommendation = async (rec: any) => {
    setProcessingRecId(rec.id);
    try {
      if (rec.type === "NewVoyage") {
        // 1. Create Flight
        const newFlightData = {
          helicopterId: rec.vesselId,
          originId: rec.originId,
          destinationId: rec.destinationId,
          departureDateTime: rec.departureDateTime,
          arrivalDateTime: rec.eta,
        };

        const newFlight = await createFlight(newFlightData as any);

        // 2. Assign Items to New Flight
        await assignItemsToFlight(newFlight.flightId, rec.itemIds);

        // Optimistic Update: Add flight to vessels
        setVessels((prev) =>
          prev.map((v) =>
            v.helicopterId === rec.vesselId
              ? { ...v, voyages: [...v.voyages, newFlight] }
              : v,
          ),
        );

        toast.success(
          `Created flight ${newFlight.flightId} and assigned items`,
        );
      } else if (rec.type === "AddToVoyage" && rec.targetVoyageId) {
        // Assign Items to Existing Flight
        await assignItemsToFlight(rec.targetVoyageId, rec.itemIds);
        toast.success(`Assigned items to flight ${rec.targetVoyageId}`);
      }

      await fetchData();

      setRecommendationData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          recommendations: prev.recommendations.filter((r) => r.id !== rec.id),
        };
      });

      setPendingRequests((prev) =>
        prev
          .map((req) => ({
            ...req,
            items: req.items.filter(
              (item) => !rec.itemIds.includes(item.itemId),
            ),
          }))
          .filter((req) => req.items.length > 0),
      );
    } catch (error) {
      toast.error("Failed to accept recommendation: " + error);
    } finally {
      setProcessingRecId(null);
    }
  };

  const handleRejectRecommendation = (rec: any) => {
    setRecommendationData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        recommendations: prev.recommendations.filter((r) => r.id !== rec.id),
      };
    });
    toast.info("Recommendation rejected");
  };

  const onSelectFlight = (_vesselId: string, flightId: string) => {
    setSelectedFlightId(flightId);
  };

  const selectedFlight = vessels
    .flatMap((v) => v.voyages)
    .find((f) => f.flightId === selectedFlightId);

  const selectedVessel = vessels.find((v) =>
    v.voyages.some((f) => f.flightId === selectedFlightId),
  );

  const activeCargoTypes = Array.from(
    new Set(
      vessels.flatMap((v) =>
        v.voyages.flatMap((f) => f.cargoDistribution.map((c) => c.type)),
      ),
    ),
  ).map((type) => ({
    type,
    ...CARGO_TYPE_CONFIG[type],
  }));

  const [isInsightsCollapsed, setIsInsightsCollapsed] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingRecId, setProcessingRecId] = useState<string | null>(null);
  const [recommendationData, setRecommendationData] =
    useState<RecommendationSummary | null>(null);

  const handleOptimize = async () => {
    setIsInsightsCollapsed(false); // Open panel
    setIsAnalyzing(true);
    setRecommendationData(null); // Reset previous

    try {
      const candidates = await optimizeVoyagePlan();

      // Map candidates to RecommendationSummary
      const recommendations: VoyageRecommendation[] = candidates.map(
        (cand, idx) => ({
          id: cand.voyageId || `rec-${idx}-${Date.now()}`,
          vesselId: cand.vesselId,
          vesselName: cand.vesselName || "Unknown Helicopter",
          origin: cand.originName || cand.originId,
          originId: cand.originId,
          destination: cand.destinationName || cand.destinationId,
          destinationId: cand.destinationId,
          departureDateTime: cand.departureTime,
          eta: cand.arrivalTime,
          requestIds: cand.assignedRequestIds,
          itemIds: cand.aggregatedItemIds,
          score: cand.score,
          reason: cand.voyageId
            ? `Add to existing flight ${cand.voyageId}`
            : "Create new optimized flight",
          type: cand.voyageId ? "AddToVoyage" : "NewVoyage",
          status: "Pending",
          targetVoyageId: cand.voyageId,
          totalWeight: cand.totalWeightUsed,
          totalDeckArea: cand.totalDeckUsed,
          itemCount: cand.totalItems,
        }),
      );

      const urgentUnscheduled = pendingRequests.filter(
        (r) =>
          r.urgencyId === "production-critical" ||
          r.urgencyId === "project-critical",
      );

      const avgScore =
        recommendations.length > 0
          ? recommendations.reduce((acc, curr) => acc + curr.score, 0) /
            recommendations.length
          : 0.95;

      const penalty = urgentUnscheduled.length * 0.05;
      const overallScore = Math.max(0, Math.min(1, avgScore - penalty));

      setRecommendationData({
        recommendations,
        urgentUnscheduled,
        overallScore,
      });

      toast.success("Optimization analysis complete");
    } catch (error) {
      console.error("Optimization failed:", error);
      toast.error("Failed to run optimization engine");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const navigate = useNavigate();

  // Assuming we might have an aviation simulation page later
  const handleCompareScenarios = () => {
    navigate("/aviation/simulation");
  };

  return (
    <Box
      className="app-shell"
      sx={{
        p: 0,
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {/* HEADER */}
      <Box sx={{ flexShrink: 0 }}>
        <AviationHeader
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onApplyDateRange={handleApplyDateRange}
          vessels={vessels}
          selectedVesselIds={selectedVesselIds}
          setSelectedVesselIds={setSelectedVesselIds}
          routeFilters={routeFilters}
          setRouteFilters={setRouteFilters}
          onOptimize={handleOptimize}
          onCompareScenarios={handleCompareScenarios}
          onRefresh={fetchData}
        />
      </Box>

      {isLoading && <LoadingIndicator />}

      {/* SCROLL CONTAINER */}
      <Box
        component="main"
        className="main-grid"
        sx={{
          p: 1.25,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {/* MIDDLE ROW */}
        <Box
          className="middle-row"
          sx={{
            display: "grid",
            gridTemplateColumns: isInsightsCollapsed
              ? "280px 1fr"
              : "280px minmax(0, 1.8fr) 350px",
            columnGap: 1.25,
            rowGap: 1.25,
            transition:
              "grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            height: "60vh",
            mb: 0.5,
            flexShrink: 0,
          }}
        >
          <RequestQueue requests={pendingRequests} />

          {/* Reusing VoyageTimeline but it refers to vessels/voyages. Terminology might be marine-specific in UI. 
              We might need to clone VoyageTimeline too if we want "Flights" in the header. 
              For now, let's stick with VoyageTimeline as it likely just renders rows.
          */}
          <VoyageTimeline
            vessels={vessels
              .filter(
                (v) =>
                  v.helicopterId && selectedVesselIds.includes(v.helicopterId),
              )
              .map((v) => ({
                ...v,
                voyages: v.voyages.filter((flight) => {
                  if (routeFilters.length === 0) return true;
                  return routeFilters.some((filter) => {
                    const matchOrigin =
                      !filter.origin ||
                      flight.originId === filter.origin ||
                      flight.originName === filter.origin;
                    const matchDest =
                      !filter.destination ||
                      flight.destinationId === filter.destination ||
                      flight.destinationName === filter.destination;
                    return matchOrigin && matchDest;
                  });
                }),
              }))
              .filter((v) => v.voyages.length > 0)}
            activeCargoTypes={activeCargoTypes}
            selectedVoyageId={selectedFlightId}
            onSelectVoyage={onSelectFlight}
            onDropRequest={handleDropRequestOnFlight}
            startDate={startDate}
            endDate={endDate}
            isLoading={isLoading}
            isInsightsCollapsed={isInsightsCollapsed}
            onToggleInsights={() =>
              setIsInsightsCollapsed(!isInsightsCollapsed)
            }
            onVoyageUpdated={fetchData}
          />

          <Box
            sx={{
              overflow: "hidden",
              transition: "opacity 0.2s ease, transform 0.2s ease",
              opacity: isInsightsCollapsed ? 0 : 1,
              pointerEvents: isInsightsCollapsed ? "none" : "auto",
              display: isInsightsCollapsed ? "none" : "flex",
              flexDirection: "column",
              minHeight: 0,
              height: "100%",
            }}
          >
            <InsightsActions
              vessels={vessels}
              requests={pendingRequests}
              isAnalyzing={isAnalyzing}
              processingRecId={processingRecId}
              recommendationData={recommendationData}
              onAcceptRecommendation={handleAcceptRecommendation}
              onRejectRecommendation={handleRejectRecommendation}
            />
          </Box>
        </Box>

        {/* BOTTOM PANEL - Helicopter Layout */}
        <Box sx={{ mt: 0.5, flexShrink: 0 }}>
          <HelicopterLayout vessel={selectedVessel} voyage={selectedFlight} />
        </Box>
      </Box>
    </Box>
  );
}
