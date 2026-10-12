import type { Severity } from "@/types";

export function workOrderStatusLabel(status: string | undefined, assignmentState?: string) {
  const labels: Record<string, string> = {
    pending: assignmentState === "pending" ? "Pending Acceptance" : "Pending Assignment",
    accepted: "Assigned", in_progress: "In Progress",
    completed: "Awaiting Provider Review", provider_accepted: "Awaiting City Verification",
    rework_required: "Needs Correction", city_correction_required: "Returned by City Engineering",
    verified: "Closed",
  };
  return labels[status ?? ""] ?? "Status Unavailable";
}

export function workOrderStatusTone(status: string | undefined): Severity {
  if (status === "verified") return "success";
  if (["completed", "city_correction_required", "rework_required", "pending"].includes(status ?? "")) return "warning";
  if (["provider_accepted", "in_progress", "accepted"].includes(status ?? "")) return "information";
  return "neutral";
}
