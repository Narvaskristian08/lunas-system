import "server-only";

import { backendRequest, isBackendApiError, responseData } from "@/lib/api/backend.server";
import { requireAccessToken } from "@/lib/auth/dal.server";
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
  return {
    id: incident.reportNumber ?? incident.id ?? incident._id ?? "Report",
    category: titleCase(incident.category, "Infrastructure report"),
    status: titleCase(incident.status, "Submitted"),
    priority: titleCase(incident.priority, "Standard"),
    location: incidentLocation(incident),
    createdAt: incident.createdAt,
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
  const [summary, queue] = await Promise.all([
    responseData(await backendRequest<ValidationSummaryPayload>("/stats/validation-summary", { accessToken })),
    responseData(await backendRequest<IncidentListPayload | BackendIncident[]>("/incidents/pending-validation?limit=5", { accessToken })),
  ]);
  const { incidents } = extractIncidentList(queue);
  return {
    metrics: [
      metric("Awaiting validation", asNumber(summary.pending), "warning", "reports"),
      metric("Validated", asNumber(summary.validated), "information", "incident"),
      metric("Rejected", asNumber(summary.rejected), "critical", "reports"),
      metric("Duplicates", asNumber(summary.duplicate), "neutral", "verified"),
    ],
    records: incidents.map(recordFromIncident),
    emptyTitle: "No reports awaiting validation",
    emptyDescription: "Submitted reports in your authorized jurisdiction will appear here when citizen reports arrive.",
  };
}

export async function getRealDashboardData(viewer: UserProfile) {
  if (![
    "citizen",
    "barangay_official",
    "city_engineer",
    "admin",
  ].includes(viewer.backendRole)) {
    return {
      metrics: [],
      records: [],
      emptyTitle: "This operational workspace is not available yet",
      emptyDescription: "Routed-provider and repair-personnel workspaces begin after the validation-and-routing milestone. No placeholder records are shown.",
    };
  }
  const accessToken = await requireAccessToken();
  return viewer.backendRole === "citizen"
    ? citizenDashboard(accessToken)
    : operationsDashboard(accessToken);
}
