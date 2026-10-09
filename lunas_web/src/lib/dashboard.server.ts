import "server-only";

import { backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken } from "@/lib/auth/dal.server";
import { getWorkOrderSummary, getWorkOrders, type WorkOrder } from "@/lib/work-orders.server";
import type { DashboardMetric, Severity, UserProfile } from "@/types";

interface BackendIncident {
  id?: string;
  _id?: string;
  reportNumber?: string;
  category?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  location?: {
    address?: {
      street?: string;
      barangay?: string;
      city?: string;
    };
  };
  repair?: {
    reference?: string;
    status?: string;
    assignmentState?: string;
    progressPercent?: number;
    stage?: string;
    readyForCompletion?: boolean;
    updatedAt?: string;
  };
}

interface IncidentListPayload {
  incidents?: BackendIncident[];
  data?: BackendIncident[];
  pagination?: { total?: number };
}

interface ValidationSummaryPayload {
  pending?: number;
  validated?: number;
  rejected?: number;
  duplicate?: number;
  total?: number;
}

export interface DashboardRecord {
  id: string;
  href?: string;
  category: string;
  status: string;
  priority: string;
  location: string;
  createdAt?: string;
  repairProgress?: number;
  readyForCompletion?: boolean;
}

export interface RealDashboardData {
  engineeringSummary?: { total: number; unresolved: number; overdue: number };
  barangayReports?: Array<{ barangay: string; reports: number; unresolved: number }>;
  metrics: DashboardMetric[];
  records: DashboardRecord[];
  emptyTitle: string;
  emptyDescription: string;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function titleCase(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function incidentLocation(incident: BackendIncident) {
  const address = incident.location?.address;
  return [address?.street, address?.barangay, address?.city].filter(Boolean).join(", ") || "Location pending";
}

function recordFromIncident(incident: BackendIncident): DashboardRecord {
  const repairProgress = typeof incident.repair?.progressPercent === "number"
    ? incident.repair.progressPercent
    : undefined;
  const repairStatus = incident.repair?.readyForCompletion
    ? "Repair completed · awaiting Utility Provider review"
    : repairProgress !== undefined && repairProgress > 0
      ? `Repair progress: ${repairProgress}%`
      : incident.repair?.status === "pending" && incident.repair?.assignmentState === "unassigned"
        ? "Work order created · awaiting assignment"
      : incident.repair?.status === "pending"
        ? "Assigned for repair"
        : undefined;
  return {
    id: incident.reportNumber ?? incident.id ?? incident._id ?? "Report",
    href: incident.id || incident._id ? `/validation-routing/${encodeURIComponent(incident.id ?? incident._id ?? "")}` : undefined,
    category: titleCase(incident.category, "Infrastructure report"),
    status: repairStatus ?? titleCase(incident.status, "Submitted"),
    priority: titleCase(incident.priority, "Standard"),
    location: incidentLocation(incident),
    createdAt: incident.repair?.updatedAt ?? incident.createdAt,
    repairProgress,
    readyForCompletion: incident.repair?.readyForCompletion,
  };
}

function recordFromWorkOrder(workOrder: WorkOrder): DashboardRecord {
  return {
    id: workOrder.reference,
    href: `/work-orders/${encodeURIComponent(workOrder.id)}`,
    category: workOrder.incident?.category
      ? `Work order · ${titleCase(workOrder.incident.category, "Infrastructure repair")}`
      : "Maintenance work order",
    status: workOrder.status === "completed"
      ? "Repair completed · awaiting Utility Provider review"
      : workOrder.status === "provider_accepted"
        ? "Provider accepted · awaiting City Engineering verification"
        : workOrder.status === "city_correction_required"
          ? "City Engineering requested corrective work"
          : titleCase(workOrder.status, "Pending"),
    priority: titleCase(workOrder.priority, "Standard"),
    location: [
      workOrder.incident?.location.address.street,
      workOrder.incident?.location.address.barangay,
      workOrder.incident?.location.address.city,
    ].filter(Boolean).join(", ") || "Location pending",
    createdAt: workOrder.updatedAt ?? workOrder.createdAt,
  };
}

function extractIncidentList(payload: IncidentListPayload | BackendIncident[]) {
  if (Array.isArray(payload)) return { incidents: payload, total: payload.length };
  const incidents = payload.incidents ?? payload.data ?? [];
  return { incidents, total: payload.pagination?.total ?? incidents.length };
}

function metric(label: string, value: number, tone: Severity, icon: DashboardMetric["icon"]): DashboardMetric {
  return { label, value: new Intl.NumberFormat("en-PH").format(value), tone, icon };
}

async function reviewQueueDashboard(accessToken: string, role: "barangay_official" | "city_engineer"): Promise<RealDashboardData> {
  const [summary, queue] = await Promise.all([
    responseData(await backendRequest<ValidationSummaryPayload>("/stats/validation-summary", { accessToken })),
    responseData(await backendRequest<IncidentListPayload | BackendIncident[]>("/incidents/pending-validation?limit=5", { accessToken })),
  ]);
  const { incidents } = extractIncidentList(queue);
  if (role === "barangay_official") {
    return {
      metrics: [
        metric("Awaiting Review", asNumber(summary.pending), "warning", "reports"),
        metric("Forwarded to City Engineering", asNumber(summary.validated), "information", "verified"),
        metric("Rejected", asNumber(summary.rejected), "critical", "incident"),
        metric("Confirmed Duplicates", asNumber(summary.duplicate), "neutral", "reports"),
      ],
      records: incidents.map(recordFromIncident),
      emptyTitle: "No reports awaiting Barangay review",
      emptyDescription: "New reports in your assigned Barangay will appear here.",
    };
  }
  const [workOrderSummary, finalQueue, barangayReports] = await Promise.all([
    getWorkOrderSummary(),
    getWorkOrders({ page: 1, limit: 5, status: "provider_accepted", sortBy: "newest" }),
    backendRequest<Array<{ barangay: string; reports: number; unresolved: number }>>("/stats/barangay-reports", { accessToken }).then(responseData),
  ]);
  return {
    barangayReports,
    engineeringSummary: { total: barangayReports.reduce((sum, row) => sum + row.reports, 0), unresolved: barangayReports.reduce((sum, row) => sum + row.unresolved, 0), overdue: workOrderSummary.overdue },
    metrics: [
      metric("Awaiting City Engineering Review", asNumber(summary.pending), "warning", "reports"),
      metric("Awaiting Final Verification", finalQueue.pagination.total, "information", "verified"),
      metric("Active Repairs", workOrderSummary.active, "information", "workOrder"),
      metric("Approaching Deadlines", workOrderSummary.approaching, "warning", "sla"),
      metric("Overdue Repairs", workOrderSummary.overdue, "critical", "sla"),
      metric("Repair Awaiting Provider Review", workOrderSummary.readyForCompletion, "neutral", "workOrder"),
    ],
    records: [...finalQueue.workOrders.map(recordFromWorkOrder), ...incidents.map(recordFromIncident)],
    emptyTitle: "No City Engineering reviews are waiting",
    emptyDescription: "Barangay-validated reports and provider-approved repairs will appear in their respective queues.",
  };
}

async function providerOperationsDashboard(): Promise<RealDashboardData> {
  const [summary, workOrderQueue] = await Promise.all([
    getWorkOrderSummary(),
    getWorkOrders({ page: 1, limit: 5, sortBy: "deadline" }),
  ]);
  return {
    metrics: [
      metric("Unassigned Work", summary.unassigned, "warning", "workOrder"),
      metric("Pending Acceptance", summary.pendingAcceptance, "information", "workOrder"),
      metric("Active Repairs", summary.active, "information", "workOrder"),
      metric("Approaching Deadlines", summary.approaching, "warning", "sla"),
      metric("Overdue Work", summary.overdue, "critical", "sla"),
      metric("Completed · Awaiting Review", summary.readyForCompletion, "warning", "workOrder"),
      metric("Awaiting City Verification", summary.awaitingFinalVerification, "information", "verified"),
      metric("City Returns to Coordinate", summary.cityCorrections, "warning", "incident"),
      metric("Corrective Repairs", summary.correctiveRepairs, "information", "workOrder"),
    ],
    records: workOrderQueue.workOrders.map(recordFromWorkOrder),
    emptyTitle: "No provider work orders",
    emptyDescription: "Routed work orders in your provider organization will appear here when they are created.",
  };
}

export async function getRealDashboardData(viewer: UserProfile) {
  if (viewer.backendRole === "utility_provider") return providerOperationsDashboard();
  if (viewer.backendRole === "barangay_official" || viewer.backendRole === "city_engineer") {
    return reviewQueueDashboard(await requireAccessToken(), viewer.backendRole);
  }
  throw new Error("This web dashboard is only available to operational web roles");
}
