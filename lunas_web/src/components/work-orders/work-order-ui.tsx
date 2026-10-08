import { Badge, StatusBadge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";
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

export function workOrderStatusTone(status: string | undefined): Severity {
  if (status === "verified") return "success";
  if (status === "completed" || status === "city_correction_required" || status === "rework_required" || status === "pending") return "warning";
  if (status === "provider_accepted") return "information";
  if (status === "in_progress") return "information";
  if (status === "accepted") return "information";
  if (status === "rejected") return "critical";
  return "neutral";
}

export function assignmentTone(status: string | undefined): Severity {
  if (status === "accepted") return "success";
  if (status === "declined") return "critical";
  if (status === "pending") return "warning";
  return "neutral";
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

export function ProgressBar({ value, className, label = true }: { value: number; className?: string; label?: boolean }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("min-w-[116px]", className)}>
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
        {label ? <span>{clamped}%</span> : <span className="sr-only">{clamped}% repair progress</span>}
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Repair Progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={clamped}>
        <div className={cn("h-full rounded-full transition-[width]", clamped === 100 ? "bg-emerald-600" : "bg-brand-600")} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
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
