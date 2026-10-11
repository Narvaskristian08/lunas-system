import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { AuditLogPage, AuditLogRecord } from "@/lib/audit-logs.server";
import { formatDateTime } from "@/lib/utils";
import type { Severity } from "@/types";

const eventLabel = (action: string) => action
  .split("_")
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const auditEvents = [
  "user_login",
  "user_logout",
  "auth_token_refreshed",
  "user_created",
  "user_updated",
  "user_archived",
  "authorized_account_created",
  "account_activation_sent",
  "account_activation_completed",
  "account_suspended",
  "account_reactivated",
  "account_deactivated",
  "account_jurisdiction_changed",
  "registration_mfa_challenged",
  "registration_mfa_verified",
  "registration_mfa_failed",
  "registration_mfa_delivery_failed",
  "login_captcha_failed",
  "login_captcha_unavailable",
  "user_archive_failed",
  "password_reset_requested",
  "password_reset_completed",
  "role_changed",
  "permission_changed",
  "settings_changed",
  "incident_created",
  "incident_updated",
  "incident_deleted",
  "incident_validated",
  "incident_barangay_validated",
  "incident_city_confirmed",
  "incident_clarification_requested",
  "ai_analysis_completed",
  "ai_analysis_unavailable",
  "ai_analysis_failed",
  "incident_rejected",
  "incident_marked_duplicate",
  "incident_priority_assigned",
  "incident_jurisdiction_updated",
  "incident_routed",
  "incident_assigned",
  "incident_closed",
  "work_order_created",
  "work_order_assigned",
  "work_order_reassigned",
  "work_order_accepted",
  "work_order_declined",
  "work_order_started",
  "work_order_updated",
  "work_order_progress_updated",
  "repair_evidence_uploaded",
  "work_order_completed",
  "work_order_verified",
  "repair_approved",
  "repair_rejected",
  "provider_correction_requested",
  "provider_completion_accepted",
  "provider_coordinated_city_correction",
  "city_engineering_returned_completion",
  "city_engineering_verified_and_closed",
  "sla_escalated",
  "sla_approaching",
  "sla_overdue",
  "file_uploaded",
  "file_deleted",
] as const;

const resultTone = (status: AuditLogRecord["status"]): Severity => {
  if (status === "success") return "success";
  if (status === "failure") return "critical";
  return "warning";
};

const contextLabel = (record: AuditLogRecord) => {
  const reason = typeof record.details?.reason === "string" ? record.details.reason.replaceAll("_", " ") : undefined;
  if (reason) return reason;
  if (record.resourceType && record.resourceId) return `${record.resourceType} · ${record.resourceId}`;
  return record.resourceType ?? "Security event";
};

export function AuditLogView({
  page,
  filters,
  error,
}: {
  page: AuditLogPage;
  filters: { action?: string; status?: string; source?: string; limit?: string };
  error?: string;
}) {
  const pageNumber = page.pagination.page;
  const filterQuery = new URLSearchParams();
  if (filters.action) filterQuery.set("action", filters.action);
  if (filters.status) filterQuery.set("status", filters.status);
  if (filters.source) filterQuery.set("source", filters.source);
  filterQuery.set("limit", String(page.pagination.limit));
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams(filterQuery);
    query.set("page", String(nextPage));
    return `/admin/audit?${query}`;
  };

  return (
    <div className="mx-auto max-w-[1680px]">
      <PageHeader
        eyebrow="LUNAS · Security accountability"
        title="Audit & Security"
        description="Read-only records for authentication, account provisioning, access changes, and operational decisions."
      />

      <Card className="mb-5 p-4">
        <form method="get" className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_180px_180px_150px_auto]">
          <label className="text-sm font-semibold text-slate-700">Event
            <select name="action" defaultValue={filters.action ?? ""} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal">
              <option value="">All Events</option>
              {auditEvents.map((event) => <option key={event} value={event}>{eventLabel(event)}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Result
            <select name="status" defaultValue={filters.status ?? ""} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal">
              <option value="">All Results</option><option value="success">Success</option><option value="failure">Failure</option><option value="warning">Warning</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Source
            <select name="source" defaultValue={filters.source ?? ""} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal">
              <option value="">All Sources</option><option value="web">Web</option><option value="mobile">Mobile</option><option value="api">API</option><option value="system">System</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Rows per page
            <select name="limit" defaultValue={String(page.pagination.limit)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal">
              <option value="25">25</option><option value="50">50</option><option value="100">100</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 self-end rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">Apply Filters</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Security Audit Trail" description={`${page.pagination.total} recorded event${page.pagination.total === 1 ? "" : "s"}. Showing ${page.records.length ? `${((pageNumber - 1) * page.pagination.limit) + 1}-${Math.min(pageNumber * page.pagination.limit, page.pagination.total)}` : "0"} on this page. Secrets and one-time codes are redacted before storage.`} />
        {error ? <EmptyState icon="data" title="Audit trail unavailable" description={error} /> : page.records.length ? (
          <DataTable
            caption="Audit and security records"
            className="[&_table]:min-w-0 [&_table]:table-fixed [&_th]:px-3 [&_td]:px-3 [&_td]:py-3 [&_td]:align-top"
            columns={[
              { key: "time", label: "Time", className: "w-[150px]" },
              { key: "event", label: "Event", className: "w-[175px]" },
              { key: "actor", label: "Actor", className: "w-[220px]" },
              { key: "source", label: "Source", className: "w-[90px]" },
              { key: "result", label: "Result", className: "w-[100px]" },
              { key: "context", label: "Context" },
            ]}
            rows={page.records.map((record) => ({
              id: record.id,
              cells: {
                time: <time className="whitespace-nowrap text-xs" dateTime={record.timestamp}>{formatDateTime(record.timestamp)}</time>,
                event: <span className="break-words font-semibold text-slate-900">{eventLabel(record.action)}</span>,
                actor: <div className="break-words"><p className="font-medium text-slate-900">{record.actor.name || record.actor.label || "System"}</p>{record.actor.email ? <p className="text-xs text-slate-500">{record.actor.email}</p> : null}</div>,
                source: <span className="whitespace-nowrap capitalize">{record.source}</span>,
                result: <StatusBadge tone={resultTone(record.status)}>{record.status}</StatusBadge>,
                context: <div className="break-words"><span>{contextLabel(record)}</span>{record.resourceType === "User" && record.changes && <details className="mt-2"><summary className="cursor-pointer text-brand-700">View change</summary><pre className="mt-2 max-w-sm whitespace-pre-wrap break-words text-xs">{JSON.stringify(record.changes, null, 2)}</pre></details>}</div>,
              },
            }))}
          />
        ) : <EmptyState icon="search" title="No matching audit events" description="No server-generated records match the selected filters." />}
        {!error && page.pagination.pages > 1 ? (
          <nav className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm" aria-label="Audit Log Pages">
            {pageNumber > 1 ? <Link className="font-semibold text-brand-700" href={pageHref(pageNumber - 1)}>Previous</Link> : <span />}
            <span className="text-slate-600">Page {pageNumber} of {page.pagination.pages}</span>
            {pageNumber < page.pagination.pages ? <Link className="font-semibold text-brand-700" href={pageHref(pageNumber + 1)}>Next</Link> : <span />}
          </nav>
        ) : null}
      </Card>
    </div>
  );
}
