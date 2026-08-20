import "server-only";

import { backendRequest, isBackendApiError, responseData } from "@/lib/api/backend.server";
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
  category: string;
  status: string;
  priority: string;
  location: string;
  createdAt?: string;
  repairProgress?: number;
  readyForCompletion?: boolean;
}

export interface RealDashboardData {
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
    ? "Repair 100% · Awaiting verification"
    : repairProgress !== undefined && repairProgress > 0
      ? `Repair progress: ${repairProgress}%`
      : incident.repair?.status === "pending" && incident.repair?.assignmentState === "unassigned"
        ? "Work order created · awaiting assignment"
      : incident.repair?.status === "pending"
        ? "Assigned for repair"
        : undefined;
  return {
    id: incident.reportNumber ?? incident.id ?? incident._id ?? "Report",
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
    category: workOrder.incident?.category
      ? `Work order · ${titleCase(workOrder.incident.category, "Infrastructure repair")}`
      : "Maintenance work order",
    status: workOrder.status === "completed" ? "Ready for completion" : titleCase(workOrder.status, "Pending"),
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

async function citizenDashboard(accessToken: string): Promise<RealDashboardData> {
  let response;
  try {
    response = responseData(
      await backendRequest<IncidentListPayload | BackendIncident[]>("/incidents/my?limit=100", { accessToken }),
    );
  } catch (error) {
    // /incidents already enforces ownership for citizens in the existing API.
    // Use it only while deployments gain the clearer /incidents/my endpoint.
    if (!isBackendApiError(error) || error.status !== 404) throw error;
    response = responseData(
      await backendRequest<IncidentListPayload | BackendIncident[]>("/incidents?limit=100", { accessToken }),
    );
  }
  const { incidents, total } = extractIncidentList(response);
  const count = (statuses: string[]) => incidents.filter((incident) => statuses.includes(incident.status ?? "")).length;
  return {
    metrics: [
      metric("My reports", total, "information", "reports"),
      metric("Submitted", count(["submitted"]), "warning", "incident"),
      metric("Being handled", count(["validated", "assigned", "in_progress"]), "information", "workOrder"),
      metric("Resolved", count(["completed", "verified", "closed"]), "success", "verified"),
    ],
    records: incidents.map(recordFromIncident),
    emptyTitle: "You have not submitted a report yet",
    emptyDescription: "Reports you submit through LUNAS will appear here with their current status.",
  };
}

async function operationsDashboard(accessToken: string): Promise<RealDashboardData> {
  const [summary, queue, workOrderSummary, workOrderQueue] = await Promise.all([
    responseData(await backendRequest<ValidationSummaryPayload>("/stats/validation-summary", { accessToken })),
    responseData(await backendRequest<IncidentListPayload | BackendIncident[]>("/incidents/pending-validation?limit=5", { accessToken })),
    getWorkOrderSummary(),
    getWorkOrders({ page: 1, limit: 5, sortBy: "newest" }),
  ]);
  const { incidents } = extractIncidentList(queue);
  return {
    metrics: [
      metric("Awaiting validation", asNumber(summary.pending), "warning", "reports"),
      metric("Unassigned work orders", workOrderSummary.unassigned, "warning", "workOrder"),
      metric("Active repairs", workOrderSummary.active, "information", "workOrder"),
      metric("Approaching deadlines", workOrderSummary.approaching, "warning", "sla"),
      metric("Overdue repairs", workOrderSummary.overdue, "critical", "sla"),
      metric("Ready for completion", workOrderSummary.readyForCompletion, "success", "verified"),
    ],
    records: workOrderQueue.workOrders.length ? workOrderQueue.workOrders.map(recordFromWorkOrder) : incidents.map(recordFromIncident),
    emptyTitle: "No maintenance activity in your scope",
    emptyDescription: "Validated incidents and their work orders will appear here when operational activity begins.",
  };
}

async function repairDashboard(): Promise<RealDashboardData> {
  const [summary, workOrderQueue] = await Promise.all([
    getWorkOrderSummary(),
    getWorkOrders({ page: 1, limit: 5, sortBy: "deadline" }),
  ]);
  return {
    metrics: [
      metric("Pending assignments", summary.pendingAcceptance, "warning", "workOrder"),
      metric("Accepted work", summary.accepted, "information", "workOrder"),
      metric("Active repairs", summary.active, "information", "workOrder"),
      metric("Approaching deadlines", summary.approaching, "warning", "sla"),
      metric("Overdue work", summary.overdue, "critical", "sla"),
      metric("Ready for completion", summary.readyForCompletion, "success", "verified"),
    ],
    records: workOrderQueue.workOrders.map(recordFromWorkOrder),
    emptyTitle: "No assigned work orders",
    emptyDescription: "Work orders assigned to you will appear here with their current repair and SLA state.",
  };
}

async function providerOperationsDashboard(): Promise<RealDashboardData> {
  const [summary, workOrderQueue] = await Promise.all([
    getWorkOrderSummary(),
    getWorkOrders({ page: 1, limit: 5, sortBy: "deadline" }),
  ]);
  return {
    metrics: [
      metric("Unassigned work", summary.unassigned, "warning", "workOrder"),
      metric("Pending acceptance", summary.pendingAcceptance, "information", "workOrder"),
      metric("Active repairs", summary.active, "information", "workOrder"),
      metric("Approaching deadlines", summary.approaching, "warning", "sla"),
      metric("Overdue work", summary.overdue, "critical", "sla"),
      metric("Ready for completion", summary.readyForCompletion, "success", "verified"),
    ],
    records: workOrderQueue.workOrders.map(recordFromWorkOrder),
    emptyTitle: "No provider work orders",
    emptyDescription: "Routed work orders in your provider organization will appear here when they are created.",
  };
}

export async function getRealDashboardData(viewer: UserProfile) {
  if (viewer.backendRole === "repair_personnel") return repairDashboard();
  if (viewer.backendRole === "utility_provider") return providerOperationsDashboard();
  if (viewer.backendRole === "citizen") return citizenDashboard(await requireAccessToken());
  if (["barangay_official", "city_engineer", "admin"].includes(viewer.backendRole)) {
    return operationsDashboard(await requireAccessToken());
  }
  return {
    metrics: [],
    records: [],
    emptyTitle: "No dashboard data is available for this account",
    emptyDescription: "The API did not return an operational dashboard for this role.",
  };
}
