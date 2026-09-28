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
  filters: { action?: string; status?: string; source?: string };
  error?: string;
}) {
  const pageNumber = page.pagination.page;
  const filterQuery = new URLSearchParams();
  if (filters.action) filterQuery.set("action", filters.action);
  if (filters.status) filterQuery.set("status", filters.status);
  if (filters.source) filterQuery.set("source", filters.source);
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams(filterQuery);
    query.set("page", String(nextPage));
    return `/admin/audit?${query}`;
  };

  return (
    <div className="mx-auto max-w-[1680px]">
      <PageHeader
        eyebrow="LUNAS · Security accountability"
        title="Audit & security"
        description="Read-only records for authentication, account provisioning, access changes, and operational decisions."
      />

      <Card className="mb-5 p-4">
        <form method="get" className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto]">
          <label className="text-sm font-semibold text-slate-700">Event action
            <input name="action" defaultValue={filters.action} maxLength={80} placeholder="e.g. user_archived" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" />
          </label>
          <label className="text-sm font-semibold text-slate-700">Result
            <select name="status" defaultValue={filters.status ?? ""} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal">
              <option value="">All results</option><option value="success">Success</option><option value="failure">Failure</option><option value="warning">Warning</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-slate-700">Source
            <select name="source" defaultValue={filters.source ?? ""} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal">
              <option value="">All sources</option><option value="web">Web</option><option value="mobile">Mobile</option><option value="api">API</option><option value="system">System</option>
            </select>
          </label>
          <button type="submit" className="min-h-11 self-end rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">Apply filters</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader title="Security audit trail" description={`${page.pagination.total} recorded event${page.pagination.total === 1 ? "" : "s"}. Secrets and one-time codes are redacted before storage.`} />
        {error ? <EmptyState icon="data" title="Audit trail unavailable" description={error} /> : page.records.length ? (
          <DataTable
            caption="Audit and security records"
            columns={[{ key: "time", label: "Time" }, { key: "event", label: "Event" }, { key: "actor", label: "Actor" }, { key: "source", label: "Source" }, { key: "result", label: "Result" }, { key: "context", label: "Context" }]}
            rows={page.records.map((record) => ({
              id: record.id,
              cells: {
                time: <time className="whitespace-nowrap text-xs" dateTime={record.timestamp}>{formatDateTime(record.timestamp)}</time>,
                event: <span className="font-semibold text-slate-900">{eventLabel(record.action)}</span>,
                actor: <div><p className="font-medium text-slate-900">{record.actor.name || record.actor.label || "System"}</p>{record.actor.email ? <p className="text-xs text-slate-500">{record.actor.email}</p> : null}</div>,
                source: <span className="capitalize">{record.source}</span>,
                result: <StatusBadge tone={resultTone(record.status)}>{record.status}</StatusBadge>,
                context: <div><span>{contextLabel(record)}</span>{record.resourceType === "User" && record.changes && <details className="mt-2"><summary className="cursor-pointer text-brand-700">View change</summary><pre className="mt-2 max-w-sm whitespace-pre-wrap break-words text-xs">{JSON.stringify(record.changes, null, 2)}</pre></details>}</div>,
              },
            }))}
          />
        ) : <EmptyState icon="search" title="No matching audit events" description="No server-generated records match the selected filters." />}
        {!error && page.pagination.pages > 1 ? (
          <nav className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm" aria-label="Audit log pages">
            {pageNumber > 1 ? <Link className="font-semibold text-brand-700" href={pageHref(pageNumber - 1)}>Previous</Link> : <span />}
            <span className="text-slate-600">Page {pageNumber} of {page.pagination.pages}</span>
            {pageNumber < page.pagination.pages ? <Link className="font-semibold text-brand-700" href={pageHref(pageNumber + 1)}>Next</Link> : <span />}
          </nav>
        ) : null}
      </Card>
    </div>
  );
}
