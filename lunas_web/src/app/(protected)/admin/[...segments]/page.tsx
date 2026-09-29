import { AuditLogView } from "@/components/admin/audit-log-view";
import { BackendApiError } from "@/lib/api/backend.server";
import { getAuditLogs } from "@/lib/audit-logs.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { notFound } from "next/navigation";

export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ action?: string; status?: string; source?: string; page?: string }>;
}) {
  const { segments } = await params;
  if (segments[0] === "audit") {
    await requirePermission("audit.view");
    const accessToken = await requireAccessToken();
    const rawFilters = await searchParams;
    const filters = {
      action: rawFilters.action?.trim().slice(0, 80) || undefined,
      status: ["success", "failure", "warning"].includes(rawFilters.status ?? "") ? rawFilters.status : undefined,
      source: ["web", "mobile", "api", "system"].includes(rawFilters.source ?? "") ? rawFilters.source : undefined,
      page: /^\d+$/.test(rawFilters.page ?? "") ? rawFilters.page : undefined,
    };
    let auditPage;
    let errorMessage: string | undefined;
    try {
      auditPage = await getAuditLogs(accessToken, filters);
    } catch (error) {
      errorMessage = error instanceof BackendApiError && error.status === 403
        ? "Your account is not authorized to read security audit records."
        : "The backend audit service could not be reached. Try again shortly.";
    }
    return <AuditLogView page={auditPage ?? { records: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } }} filters={filters} error={errorMessage} />;
  }
  notFound();
}
