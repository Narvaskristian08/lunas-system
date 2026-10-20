import "server-only";
import { backendRequest, responseData, BackendApiError } from "@/lib/api/backend.server";
import { apiEndpoint } from "@/lib/api/url";
import { requireViewer, requireAccessToken } from "@/lib/auth/dal.server";
export interface OperationalReport {
  rows: Array<{ _id: string; reportNumber?: string; category?: string; originalCategory?: string; barangay?: string; agency?: string; status?: string; agencyStatus?: string; createdAt?: string; maintenanceState?: string; assignmentState?: string; slaState?: string }>;
  totals: Record<string, number>;
  metadata: { period: string; basis: string; start: string; end: string; timezone: string; generatedAt: string; scope: string; semantics: string; filters: Record<string, string>; exportPermissions: { csv: boolean; pdf: boolean } };
  pagination: { page: number; limit: number; total: number; pages: number };
  categories?: Array<{ _id: string | null; count: number }>;
  barangays?: Array<{ _id: string | null; count: number }>;
  agencies?: Array<{ _id: string | null; count: number }>;
  statuses?: Array<{ _id: string | null; count: number }>;
  agencyStatuses?: Array<{ _id: string | null; count: number }>;
  maintenance?: Array<{ _id: string | null; count: number }>;
  assignments?: Array<{ _id: string | null; count: number }>;
  sla?: Array<{ _id: string | null; count: number }>;
}
export function reportQuery(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) throw new BackendApiError(400, "Use one value per reporting filter.");
    if (value) query.set(key, value);
  }
  return query;
}
async function reportingViewer(role: "barangay_official" | "utility_provider") {
  const viewer = await requireViewer();
  if (viewer.backendRole !== role) throw new BackendApiError(403, "This report is outside your workspace.");
  return viewer;
}
export async function getOperationalReport(params: Record<string, string | string[] | undefined>, role: "barangay_official" | "utility_provider") {
  await reportingViewer(role);
  const accessToken = await requireAccessToken();
  return responseData(await backendRequest<OperationalReport>(`/operational-reports?${reportQuery(params)}`, { accessToken }));
}
export async function exportOperationalReport(request: Request, role: "barangay_official" | "utility_provider") {
  try { await reportingViewer(role); }
  catch (error) { if (error instanceof BackendApiError) return Response.json({ message: error.message }, { status: error.status }); throw error; }
  const accessToken = await requireAccessToken();
  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some(key => params.getAll(key).length > 1)) return Response.json({ message: "Duplicate reporting parameters" }, { status: 400 });
  const format = params.get("format") || "csv"; params.delete("format");
  if (!["csv", "pdf"].includes(format)) return Response.json({ message: "Invalid export format" }, { status: 400 });
  // Export authorization is separately enforced by the backend, never inferred from page access.
  let response: Response;
  try { response = await fetch(apiEndpoint(`/operational-reports/${format}?${params}`), { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(30000) }); }
  catch { return Response.json({ message: "Reporting service unavailable" }, { status: 503 }); }
  if (!response.ok) return Response.json({ message: response.status === 403 ? "Export audience policy pending or access denied" : response.status === 413 ? "Export too large; narrow dates or filters" : "Report export could not be generated; check filters and PDF font configuration" }, { status: response.status });
  return new Response(response.body, { headers: { "Content-Type": format === "pdf" ? "application/pdf" : "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="lunas-operational-report.${format}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
