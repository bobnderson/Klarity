import { useState } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { MarineHeader } from "../components/maritime/MarineHeader";
import { VoyageTimeline } from "../components/maritime/VoyageTimeline";
import { VesselDeckLayout } from "../components/maritime/VesselDeckLayout";
import { InsightsActions } from "../components/maritime/InsightsActions";
import { RequestQueue } from "../components/maritime/RequestQueue";
import { CARGO_TYPE_CONFIG } from "../types/maritime/marine";
import type { NewVoyage, Vessel } from "../types/maritime/marine";
import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { MovementRequest } from "../types/maritime/logistics";

dayjs.extend(isoWeek);

import { useEffect } from "react";
import { getVessels } from "../services/maritime/vesselService";
import {
  getVoyages,
  getVoyagesByDateRange,
  assignItemsToVoyage,
  createVoyage,
} from "../services/maritime/voyageService";
import { getPendingRequests } from "../services/maritime/marineMovementService";
import { optimizeVoyagePlan } from "../services/maritime/voyageService";
import type {
  RecommendationSummary,
  VoyageRecommendation,
} from "../services/maritime/recommendationService";
import { toast } from "react-toastify";
import { LoadingIndicator } from "../components/common/LoadingIndicator";

export function MarinePlanner() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [selectedVesselIds, setSelectedVesselIds] = useState<string[]>([]);
  const [routeFilters, setRouteFilters] = useState<
    Array<{ origin: string | null; destination: string | null }>
  >([]);
  const [selectedVoyageId, setSelectedVoyageId] = useState<string>("");
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().startOf("isoWeek"),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    dayjs().endOf("isoWeek"),
  );
  const [pendingRequests, setPendingRequests] = useState<MovementRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    console.log("MarinePlanner: Starting fetchData...");
    setIsLoading(true);
    try {
      console.log(
        "MarinePlanner: Calling getVessels, getVoyages, getPendingRequests...",
      );
      const results = await Promise.allSettled([
        getVessels(),
        getVoyages(),
        getPendingRequests(),
      ]);

      const vesselsResult = results[0];
      const voyagesResult = results[1];
      const pendingResult = results[2];

      if (vesselsResult.status === "rejected") {
        console.error("MarinePlanner: getVessels failed", vesselsResult.reason);
        toast.error("Failed to load vessels");
      }
      if (voyagesResult.status === "rejected") {
        console.error("MarinePlanner: getVoyages failed", voyagesResult.reason);
        toast.error("Failed to load voyages");
      }
      if (pendingResult.status === "rejected") {
        console.error(
          "MarinePlanner: getPendingRequests failed",
          pendingResult.reason,
        );
        toast.error("Failed to load pending requests");
      }

      const vesselsData =
        vesselsResult.status === "fulfilled" ? vesselsResult.value : [];
      const voyagesData =
        voyagesResult.status === "fulfilled" ? voyagesResult.value : [];
      const pendingQueueData =
        pendingResult.status === "fulfilled" ? pendingResult.value : [];

      console.log(
        `MarinePlanner: Data received. Vessels: ${vesselsData.length}, Voyages: ${voyagesData.length}, Pending: ${pendingQueueData.length}`,
      );

      const vesselsWithVoyages = vesselsData.map((vessel) => ({
        ...vessel,
        voyages: voyagesData.filter(
          (voyage) => voyage.vesselId === vessel.vesselId,
        ),
      }));

      setVessels(vesselsWithVoyages);
      setSelectedVesselIds(
        vesselsWithVoyages.map((v) => v.vesselId).filter(Boolean) as string[],
      );
      setPendingRequests(pendingQueueData);

      // Select first voyage if available
      const firstVoyage = vesselsWithVoyages.flatMap((v) => v.voyages)[0];
      if (firstVoyage && !selectedVoyageId) {
        setSelectedVoyageId(firstVoyage.voyageId);
      }
    } catch (error) {
      console.error("MarinePlanner: Unexpected error in fetchData", error);
      toast.error("Failed to load dashboard data: " + error);
    } finally {
      setIsLoading(false);
      console.log("MarinePlanner: fetchData finished.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyDateRange = async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const voyagesData = await getVoyagesByDateRange(
        startDate.toISOString(),
        endDate.toISOString(),
      );

      setVessels((prevVessels) =>
        prevVessels.map((vessel) => ({
          ...vessel,
          voyages: voyagesData.filter(
            (voyage) => voyage.vesselId === vessel.vesselId,
          ),
        })),
      );
      toast.success("Voyages filtered by date range");
    } catch (error) {
      toast.error("Failed to filter voyages: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropRequestOnVoyage = (
    requestId: string,
    voyageId: string,
    vesselId: string,
  ) => {
    const request = pendingRequests.find((r) => r.requestId === requestId);
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    const voyage = vessel?.voyages.find((voy) => voy.voyageId === voyageId);

    if (!request || !voyage || !vessel) {
      toast.error("Invalid assignment target");
      return;
    }

    // 0. Route Validation
    if (
      request.originId !== voyage.originId &&
      request.originName !== voyage.originName
    ) {
      // Small allowance for comparing ID or Name since Voyage might have labels
    }

    if (
      request.destinationId !== voyage.destinationId &&
      request.destinationName !== voyage.destinationName
    ) {
      toast.error(
        `Route Mismatch: Request is ${request.originName || request.originId} → ${request.destinationName || request.destinationId}, but voyage is ${voyage.originName || voyage.originId} → ${voyage.destinationName || voyage.destinationId}`,
      );
      return;
    }

    // 1. Schedule Validation
    // Voyage Dep must be >= Request Earliest Dep
    // Voyage ETA must be <= Request Latest Arrival
    const vDep = dayjs(voyage.departureDateTime);
    const vEta = dayjs(voyage.eta);
    const rStart = dayjs(request.earliestDeparture);
    const rEnd = dayjs(request.latestArrival);

    if (vDep.isBefore(rStart)) {
      toast.error(
        `Schedule Conflict: Request ready at ${rStart.format("DD MMM HH:mm")}, but voyage departs at ${vDep.format("DD MMM HH:mm")}`,
      );
      return;
    }
    if (vEta.isAfter(rEnd)) {
      toast.error(
        `Schedule Conflict: Voyage arrives at ${vEta.format("DD MMM HH:mm")}, which is after the request deadline of ${rEnd.format("DD MMM HH:mm")}`,
      );
      return;
    }

    // 2. Capacity Validation
    const vesselCap = vessel.capacities;
    if (!vesselCap) {
      toast.error("Vessel capacity data missing");
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

    const usedArea = (voyage.deckUtil / 100) * vesselCap.deckArea;
    const usedWeight = (voyage.weightUtil / 100) * vesselCap.deadWeight;

    if (usedArea + reqArea > vesselCap.deckArea) {
      toast.error(
        `Deck Space Exceeded: Voyage needs ${reqArea.toFixed(1)}m² more, but only ${(vesselCap.deckArea - usedArea).toFixed(1)}m² is available.`,
      );
      return;
    }
    if (usedWeight + reqWeight > vesselCap.deadWeight) {
      toast.error(
        `Deadweight Exceeded: Request is ${reqWeight.toFixed(1)}t, but vessel only has ${(vesselCap.deadWeight - usedWeight).toFixed(1)}t available.`,
      );
      return;
    }

    // 3. Success - Call Service
    // Collect all item IDs for the request
    const itemIds = request.items.map((i) => i.itemId);

    assignItemsToVoyage(voyageId, itemIds)
      .then(({ success }: { success: boolean }) => {
        if (success) {
          // Remove from pending
          setPendingRequests((prev) =>
            prev.filter((r) => r.requestId !== requestId),
          );

          // Trigger a refresh to get updated vessel/voyage data (simpler than manual calculation for now)
          fetchData();

          toast.success(
            `Request ${requestId} assigned to ${vessel.vesselName} (${voyage.originName || voyage.originId} → ${voyage.destinationName || voyage.destinationId})`,
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
        // 1. Create Voyage

        // Map recommendation to Voyage structure (simplified)
        const newVoyageData = {
          vesselId: rec.vesselId,
          originId: rec.originId,
          destinationId: rec.destinationId,
          departureDateTime: rec.departureDateTime,
          eta: rec.eta,
        };

        const newVoyage = await createVoyage(newVoyageData as NewVoyage);

        // 2. Assign Items to New Voyage
        await assignItemsToVoyage(newVoyage.voyageId, rec.itemIds);

        // Optimistic Update: Add voyage to vessels
        setVessels((prev) =>
          prev.map((v) =>
            v.vesselId === rec.vesselId
              ? { ...v, voyages: [...v.voyages, newVoyage] }
              : v,
          ),
        );

        toast.success(
          `Created voyage ${newVoyage.voyageId} and assigned items`,
        );
      } else if (rec.type === "AddToVoyage" && rec.targetVoyageId) {
        // Assign Items to Existing Voyage
        await assignItemsToVoyage(rec.targetVoyageId, rec.itemIds);
        toast.success(`Assigned items to voyage ${rec.targetVoyageId}`);
      }

      // Refresh terminal data to update utilization/layouts
      await fetchData();

      // Optimistic Update: Remove from list
      setRecommendationData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          recommendations: prev.recommendations.filter((r) => r.id !== rec.id),
        };
      });

      // Optimistic Update: Remove from pending requests
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

  const onSelectVoyage = (_vesselId: string, voyageId: string) => {
    setSelectedVoyageId(voyageId);
  };

  const selectedVoyage = vessels
    .flatMap((v) => v.voyages)
    .find((voy) => voy.voyageId === selectedVoyageId);

  const selectedVessel = vessels.find((v) =>
    v.voyages.some((voy) => voy.voyageId === selectedVoyageId),
  );

  const activeCargoTypes = Array.from(
    new Set(
      vessels.flatMap((v) =>
        v.voyages.flatMap((voy) => voy.cargoDistribution.map((c) => c.type)),
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
          vesselName: cand.vesselName || "Unknown Vessel",
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
            ? `Add to existing voyage ${cand.voyageId}`
            : "Create new optimized voyage",
          type: cand.voyageId ? "AddToVoyage" : "NewVoyage",
          status: "Pending",
          targetVoyageId: cand.voyageId,
          totalWeight: cand.totalWeightUsed,
          totalDeckArea: cand.totalDeckUsed,
          itemCount: cand.totalItems,
        }),
      );

      // For now, we don't have a backend "urgent unscheduled" list, so we filter from pending
      const urgentUnscheduled = pendingRequests.filter(
        (r) =>
          r.urgencyId === "production-critical" ||
          r.urgencyId === "project-critical",
      );

      // Calculate overall score
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

  const handleCompareScenarios = () => {
    navigate("/marine-simulation");
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
      {/* HEADER — LOCK SIZE */}
      <Box sx={{ flexShrink: 0 }}>
        <MarineHeader
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

          <VoyageTimeline
            vessels={vessels
              .filter(
                (v) => v.vesselId && selectedVesselIds.includes(v.vesselId),
              )
              .map((v) => ({
                ...v,
                voyages: v.voyages.filter((voyage) => {
                  if (routeFilters.length === 0) return true;
                  return routeFilters.some((filter) => {
                    const matchOrigin =
                      !filter.origin ||
                      voyage.originId === filter.origin ||
                      voyage.originName === filter.origin;
                    const matchDest =
                      !filter.destination ||
                      voyage.destinationId === filter.destination ||
                      voyage.destinationName === filter.destination;
                    return matchOrigin && matchDest;
                  });
                }),
              }))
              .filter((v) => v.voyages.length > 0)}
            activeCargoTypes={activeCargoTypes}
            selectedVoyageId={selectedVoyageId}
            onSelectVoyage={onSelectVoyage}
            onDropRequest={handleDropRequestOnVoyage}
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

        {/* BOTTOM PANEL */}
        <Box sx={{ mt: 0.5, flexShrink: 0 }}>
          <VesselDeckLayout vessel={selectedVessel} voyage={selectedVoyage} />
        </Box>
      </Box>
    </Box>
  );
}
