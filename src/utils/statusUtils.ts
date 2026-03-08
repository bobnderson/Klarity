export type StatusStyle = {
  color: "success" | "warning" | "error" | "info" | "default";
  label: string;
};

export const getMovementRequestStatusStyle = (status: string): StatusStyle => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "confirmed":
    case "completed":
      return { color: "success", label: status };
    case "in-transit":
    case "intransit":
      return { color: "info", label: "In-Transit" };
    case "pending":
    case "submitted":
      return { color: "warning", label: "Pending" };
    case "rejected":
    case "cancelled":
      return { color: "error", label: "Rejected" };
    case "draft":
      return { color: "info", label: "Draft" };
    default:
      return { color: "default", label: status || "Unknown" };
  }
};

export const getVesselStatusStyle = (status: string): StatusStyle => {
  const s = status?.toLowerCase() || "";
  if (
    s.includes("active") ||
    s.includes("operational") ||
    s.includes("available")
  ) {
    return { color: "success", label: status || "Active" };
  }
  if (
    s.includes("maintenance") ||
    s.includes("standby") ||
    s.includes("repair")
  ) {
    return { color: "warning", label: status || "Maintenance" };
  }
  if (
    s.includes("out of service") ||
    s.includes("inactive") ||
    s.includes("decommissioned") ||
    s.includes("off-hire")
  ) {
    return { color: "error", label: status || "Inactive" };
  }
  return { color: "default", label: status || "Unknown" };
};

export const getVoyageStatusStyle = (status: string): StatusStyle => {
  const s = status?.toLowerCase() || "";
  switch (s) {
    case "arrived":
      return { color: "success", label: "Arrived" };
    case "delayed":
    case "cancelled":
      return { color: "error", label: status };
    case "enroute":
    case "en route":
      return { color: "success", label: "Enroute" };
    case "scheduled":
      return { color: "info", label: "Scheduled" };
    default:
      return { color: "default", label: status || "Unknown" };
  }
};
export const isMovementRequestStatusMatch = (
  requestStatus: string,
  filterStatus: string,
): boolean => {
  if (filterStatus === "All") return true;
  const s = requestStatus?.toLowerCase();
  const f = filterStatus?.toLowerCase();

  switch (f) {
    case "approved":
      return s === "approved" || s === "confirmed";
    case "completed":
      return s === "completed";
    case "in-transit":
      return s === "in-transit" || s === "intransit";
    case "pending":
      return s === "pending" || s === "submitted";
    case "rejected":
      return s === "rejected" || s === "cancelled";
    case "draft":
      return s === "draft";
    default:
      return s === f;
  }
};

export const getUrgencyStyle = (urgency: string) => {
  switch (urgency) {
    case "Urgent":
    case "Production Critical":
    case "Project Critical":
    case "Production Critical (deferment risk)":
      return {
        color: "#ef4444",
        bg: "rgba(239, 68, 68, 0.1)",
        icon: "Zap",
      };
    case "HSSE / Regulatory":
    case "Priority":
    case "HSE / Regulatory":
    case "Project Critical Path":
      return {
        color: "#f59e0b",
        bg: "rgba(245, 158, 11, 0.1)",
        icon: "AlertCircle",
      };
    case "Just In Time":
      return {
        color: "#8b5cf6",
        bg: "rgba(139, 92, 246, 0.1)",
        icon: "Clock",
      };
    case "Milk Run":
      return {
        color: "#06b6d4",
        bg: "rgba(6, 182, 212, 0.1)",
        icon: "RefreshCw",
      };
    case "Routine":
    case "Routine Ops":
    case "Nice-to-have":
    default:
      return {
        color: "#3b82f6",
        bg: "rgba(59, 130, 246, 0.1)",
        icon: null,
      };
  }
};
