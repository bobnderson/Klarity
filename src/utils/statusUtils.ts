export type StatusStyle = {
  color: "success" | "warning" | "error" | "info" | "default";
  label: string;
};

export const getMovementRequestStatusStyle = (status: string): StatusStyle => {
  switch (status?.toLowerCase()) {
    case "approved":
    case "confirmed":
      return { color: "success", label: "Approved" };
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
      return { color: "success", label: "En Route" };
    case "scheduled":
      return { color: "info", label: "Scheduled" };
    default:
      return { color: "default", label: status || "Unknown" };
  }
};
