import Link from "next/link";
import { FilterSelect } from "@/components/ui/filters";
import { categoryLabel } from "@/lib/category-label";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import type { ProviderIncidentFilters, ProviderIncidentQueueData } from "@/lib/work-orders.server";
import { titleCase, priorityTone } from "@/components/work-orders/work-order-ui";

function agencyStatusLabel(status?: string) {
  if (status === "pending_budget" || status === "pending_procurement") return "Pending procurement / bidding";
  if (status === "in_progress" || status === "work_in_progress") return "Work in progress";
  if (status === "completed" || status === "work_completed") return "Work completed";
  if (status === "correction_required") return "Correction required";
  return "New agency report";
}

function pageHref(filters: ProviderIncidentFilters, page: number) {
  const params = new URLSearchParams({ view: "orders", page: String(page), limit: String(filters.limit) });
  if (filters.search) params.set("search", filters.search);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.category) params.set("category", filters.category);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  return `/work-orders?${params.toString()}`;
}

export function ProviderIncidentList({ queue, filters }: { queue: ProviderIncidentQueueData; filters: ProviderIncidentFilters }) {
  return <Card className="overflow-hidden">
    <CardHeader title="Agency Reports" description="Routed reports that your agency can update through the LUNAS workflow." />
    <form method="get" action="/work-orders" className="grid items-end gap-4 border-b border-slate-200 bg-slate-50/70 p-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(11rem,14rem)_minmax(10rem,12rem)_auto]">
      <input type="hidden" name="view" value="orders" />
      <label className="flex min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-1">
        <span>Search</span>
        <input name="search" defaultValue={filters.search ?? ""} placeholder="Report number or description" className="min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
      </label>
      <FilterSelect label="Priority" name="priority" defaultValue={filters.priority ?? ""} options={[
        { value: "", label: "All priorities" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" },
      ]} />
      <FilterSelect label="Sort" name="sortBy" defaultValue={filters.sortBy ?? "newest"} options={[
        { value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "priority", label: "Priority" },
      ]} />
      <button type="submit" className="min-h-11 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white outline-none hover:bg-brand-800 focus-visible:ring-3 focus-visible:ring-sky-200 sm:col-span-2 xl:col-span-1">Search</button>
    </form>
    {queue.incidents.length ? <div className="divide-y divide-slate-200">
      {queue.incidents.map((incident) => <Link key={incident.id} href={`/work-orders/intake/${encodeURIComponent(incident.id)}`} className="block p-5 transition hover:bg-brand-50">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="font-semibold text-brand-700">{incident.reportNumber}</p><p className="mt-1 text-sm text-slate-700">{categoryLabel(incident.category, "Uncategorized")}</p><p className="mt-1 text-xs text-slate-500">{incident.location.address.barangay || "Barangay unavailable"}</p></div>
          <div className="flex flex-wrap items-center gap-2">{incident.priority ? <Badge tone={priorityTone(incident.priority)}>{titleCase(incident.priority)}</Badge> : null}<StatusBadge tone="information">{agencyStatusLabel(incident.agencyStatus)}</StatusBadge></div>
        </div>
      </Link>)}
    </div> : <EmptyState icon="records" title="No agency reports" description="Reports routed to your organization will appear here." />}
    {queue.pagination.pages > 1 ? <nav aria-label="Agency report pages" className="flex items-center justify-between border-t border-slate-200 p-4 text-sm"><span className="text-slate-600">Page {queue.pagination.page} of {queue.pagination.pages} · {queue.pagination.total} reports</span><div className="flex gap-2">{queue.pagination.page > 1 ? <Link href={pageHref(filters, queue.pagination.page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">Previous</Link> : null}{queue.pagination.page < queue.pagination.pages ? <Link href={pageHref(filters, queue.pagination.page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">Next</Link> : null}</div></nav> : null}
  </Card>;
}
