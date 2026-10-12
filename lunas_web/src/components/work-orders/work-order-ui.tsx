import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { Severity } from "@/types";
import type { WorkOrderLocation, WorkOrderSla } from "@/lib/work-orders.server";

export function titleCase(value: string | undefined, fallback = "Not available") {
  if (!value) return fallback;
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function priorityTone(priority: string | undefined): Severity {
  if (priority === "critical") return "critical";
  if (priority === "high") return "warning";
  if (priority === "medium") return "information";
  return "neutral";
}

export { workOrderStatusLabel, workOrderStatusTone } from "@/lib/work-order-status";

export function assignmentLabel(status: string | undefined, history = false) {
  if (status === "reassigned") return history ? "Reassigned" : "Assigned";
  if (status === "accepted") return "Accepted";
  if (status === "pending") return "Pending Acceptance";
  if (status === "declined") return "Declined";
  return "Unassigned";
}

export function assignmentTone(status: string | undefined): Severity {
  if (status === "accepted") return "information";
  if (status === "reassigned") return "neutral";
  return "warning";
}

export function slaTone(sla: WorkOrderSla): Severity {
  if (sla.isOverdue || sla.state === "overdue") return "critical";
  if (sla.isApproaching || sla.state === "approaching") return "warning";
  if (sla.state === "met") return "success";
  if (sla.state === "active") return "information";
  return "neutral";
}

export function formatLocation(location: WorkOrderLocation | undefined) {
  if (!location) return "Location unavailable";
  return [location.address.street, location.address.barangay, location.address.city].filter(Boolean).join(", ") || "Location unavailable";
}

export function formatPerson(firstName?: string, lastName?: string, fallback = "Unassigned") {
  const name = [firstName, lastName].filter(Boolean).join(" ");
  return name || fallback;
}

export function formatRemaining(remainingMilliseconds: number | undefined) {
  if (remainingMilliseconds === undefined) return undefined;
  const absolute = Math.abs(remainingMilliseconds);
  const totalMinutes = Math.floor(absolute / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const display = days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  return remainingMilliseconds < 0 ? `${display} overdue` : `${display} remaining`;
}

export function SlaBadges({ sla, includeDeadline = false }: { sla: WorkOrderSla; includeDeadline?: boolean }) {
  const remaining = formatRemaining(sla.remainingMilliseconds);
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusBadge tone={slaTone(sla)}>{titleCase(sla.state)}</StatusBadge>
      {remaining ? <Badge tone={slaTone(sla)}>{remaining}</Badge> : null}
      {includeDeadline && sla.deadline ? <span className="w-full text-xs text-slate-600">Due {formatDateTime(sla.deadline)}</span> : null}
    </div>
  );
}
