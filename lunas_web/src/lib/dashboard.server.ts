import { workOrderStatusLabel, workOrderStatusTone } from "@/lib/work-order-status";
import { categoryLabel } from "@/lib/category-label";
import "server-only";

import { backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken } from "@/lib/auth/dal.server";
import { getWorkOrderSummary, getWorkOrders, getProviderIncidentQueue, type WorkOrder } from "@/lib/work-orders.server";
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
  statusTone?: Severity;
}

export interface DashboardReportingAppeal {
  id: string;
  reporter?: { id: string; firstName?: string; lastName?: string; email?: string };
  assignedBarangay: string;
  explanation: string;
  evidenceReference: string;
  status: "pending" | "approved" | "rejected";
  version: number;
  createdAt?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface RealDashboardData {
  barangayReports?: Array<{ barangay: string; reports: number; unresolved: number }>;
  reportingAppeals?: DashboardReportingAppeal[];
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
    category: categoryLabel(incident.category, "Infrastructure report"),
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
      ? `Work order · ${categoryLabel(workOrder.incident.category, "Infrastructure repair")}`
      : "Maintenance work order",
    status: workOrderStatusLabel(workOrder.status, workOrder.assignmentState),
    statusTone: workOrderStatusTone(workOrder.status),
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

type ReportingAppealListPayload = DashboardReportingAppeal[] | { appeals?: DashboardReportingAppeal[] };

async function pendingReportingAppeals(accessToken: string) {
  try {
    const payload = responseData(await backendRequest<ReportingAppealListPayload>("/reporting-appeals?status=pending&limit=5", { accessToken }));
    return Array.isArray(payload) ? payload : payload.appeals ?? [];
  } catch {
    // Appeal visibility should not take down the operational dashboard when
    // the separate appeal endpoint is temporarily unavailable.
    return [];
  }
}

async function reviewQueueDashboard(accessToken: string, role: "barangay_official" | "city_engineer"): Promise<RealDashboardData> {
  if (role === "city_engineer") {
    const [barangayReports, validation, summary, reviewQueue, verificationQueue] = await Promise.all([
      responseData(await backendRequest<Array<{ barangay: string; reports: number; unresolved: number }>>("/stats/barangay-reports", { accessToken })),
      responseData(await backendRequest<ValidationSummaryPayload>("/stats/validation-summary", { accessToken })),
      getWorkOrderSummary(),
      responseData(await backendRequest<IncidentListPayload>("/incidents/pending-validation?limit=5", { accessToken })),
      getWorkOrders({ page: 1, limit: 5, status: "provider_accepted", sortBy: "deadline" }),
    ]);
    return {
      barangayReports,
      metrics: [
        metric("Awaiting Review", asNumber(validation.pending), "warning", "reports"),
        metric("Awaiting Verification", summary.awaitingFinalVerification, "warning", "verified"),
        metric("Overdue", summary.overdue, "critical", "sla"),
      ],
      records: [...verificationQueue.workOrders.map(recordFromWorkOrder), ...extractIncidentList(reviewQueue).incidents.map(recordFromIncident)],
      emptyTitle: "No reports or repairs awaiting City Engineering",
      emptyDescription: "Reports awaiting review and repairs awaiting verification will appear here.",
    };
  }
  const [summary, queue, reportingAppeals] = await Promise.all([
    responseData(await backendRequest<ValidationSummaryPayload>("/stats/validation-summary", { accessToken })),
    responseData(await backendRequest<IncidentListPayload | BackendIncident[]>("/incidents/pending-validation?limit=5", { accessToken })),
    pendingReportingAppeals(accessToken),
  ]);
  const { incidents } = extractIncidentList(queue);
  {
    return {
      metrics: [
        metric("Awaiting Review", asNumber(summary.pending), "warning", "reports"),
        metric("Forwarded to City Engineering", asNumber(summary.validated), "information", "verified"),
        metric("Rejected", asNumber(summary.rejected), "critical", "incident"),
        metric("Confirmed Duplicates", asNumber(summary.duplicate), "neutral", "reports"),
      ],
      reportingAppeals,
      records: incidents.map(recordFromIncident),
      emptyTitle: "No reports awaiting Barangay review",
      emptyDescription: "New reports in your assigned Barangay will appear here.",
    };
  }
}

async function providerOperationsDashboard(): Promise<RealDashboardData> {
  const [summary, workOrderQueue, intake] = await Promise.all([
    getWorkOrderSummary(),
    getWorkOrders({ page: 1, limit: 5, sortBy: "deadline" }),
    getProviderIncidentQueue({ page: 1, limit: 1 }),
  ]);
  return {
    metrics: [
      metric("New Agency Reports", intake.pagination.total, "warning", "workOrder"),
      metric("Work in Progress", summary.active, "information", "workOrder"),
      metric("Work Completed", summary.readyForCompletion, "information", "verified"),
      metric("Needs Correction", summary.correctiveRepairs + summary.cityCorrections, "warning", "incident"),
      metric("Overdue", summary.overdue, "critical", "sla"),
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
