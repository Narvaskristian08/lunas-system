"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpDown, ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { FilterBar, FilterSelect } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { buttonStyles } from "@/components/ui/button";
import type { UserProfile } from "@/types";
import type { WorkOrderFilters, WorkOrderQueueData, WorkOrderSummary } from "@/lib/work-orders.server";
import { assignmentTone, formatLocation, formatPerson, priorityTone, ProgressBar, SlaBadges, titleCase, workOrderStatusTone } from "@/components/work-orders/work-order-ui";
import { formatDateTime } from "@/lib/utils";

type QueryPatch = Record<string, string | undefined>;

function optionValue(value: string | number | undefined) {
  return value === undefined ? "" : String(value);
}

function hasFilters(filters: WorkOrderFilters) {
  return Boolean(
    filters.search
    || filters.status
    || filters.priority
    || filters.assignmentStatus
    || filters.progress !== undefined
    || filters.slaState
    || filters.category
    || filters.organization
    || filters.personnel,
  );
}

function summaryCards(summary: WorkOrderSummary) {
  return [
    { label: "Unassigned", value: summary.unassigned, tone: "warning" as const },
    { label: "Pending acceptance", value: summary.pendingAcceptance, tone: "information" as const },
    { label: "Active repairs", value: summary.active, tone: "information" as const },
    { label: "Approaching deadline", value: summary.approaching, tone: "warning" as const },
    { label: "Overdue", value: summary.overdue, tone: "critical" as const },
    { label: "Completed · provider review", value: summary.readyForCompletion, tone: "warning" as const },
    { label: "Awaiting City verification", value: summary.awaitingFinalVerification, tone: "information" as const },
    { label: "City returns to coordinate", value: summary.cityCorrections, tone: "warning" as const },
    { label: "Corrective repairs", value: summary.correctiveRepairs, tone: "information" as const },
  ];
}

export function WorkOrderList({
  viewer,
  queue,
  filters,
  summary,
  mode = "work-orders",
}: {
  viewer: UserProfile;
  queue: WorkOrderQueueData;
  filters: WorkOrderFilters;
  summary?: WorkOrderSummary;
  mode?: "work-orders" | "sla";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search ?? "");
  const isSla = mode === "sla";
  const title = isSla ? "SLA monitor" : "Work orders";
  const description = isSla
    ? "Backend-calculated deadlines and repair status for work orders in your authorized scope."
    : viewer.backendRole === "repair_personnel"
      ? "Only work orders assigned to you are shown."
      : "Create, assign, and monitor maintenance work within your authorized scope.";

  const navigate = (patch: QueryPatch) => {
    const next = new URLSearchParams();
    const current: QueryPatch = {
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      assignmentStatus: filters.assignmentStatus,
      progress: filters.progress === undefined ? undefined : String(filters.progress),
      slaState: filters.slaState,
      personnel: filters.personnel,
      organization: filters.organization,
      category: filters.category,
      sortBy: filters.sortBy,
      limit: String(filters.limit),
      page: String(filters.page),
    };
    const merged = { ...current, ...patch };
    if (!Object.prototype.hasOwnProperty.call(patch, "page")) merged.page = "1";
    for (const [key, value] of Object.entries(merged)) {
      if (value) next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    navigate({
      search: undefined,
      status: undefined,
      priority: undefined,
      assignmentStatus: undefined,
      progress: undefined,
      slaState: undefined,
      personnel: undefined,
      organization: undefined,
      category: undefined,
      sortBy: "newest",
    });
  };

  const columns = [
    { key: "workOrder", label: "Work order" },
    { key: "incident", label: "Incident" },
    { key: "location", label: "Location" },
    { key: "priority", label: "Priority" },
    { key: "organization", label: "Organization" },
    { key: "assignee", label: "Assigned personnel" },
    { key: "assignment", label: "Assignment" },
    { key: "repair", label: "Repair status" },
    { key: "progress", label: "Progress" },
    { key: "sla", label: "SLA" },
    { key: "updated", label: "Updated" },
  ];

  return (
    <div className="mx-auto max-w-[1680px]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">{isSla ? "Maintenance operations · Deadline control" : "Maintenance operations · Command center"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {!isSla && viewer.permissions.includes("reports.view") ? <Link href="/validation-routing" className={buttonStyles({ variant: "secondary" })}><ClipboardList className="size-4" aria-hidden="true" /> Open validation queue</Link> : null}
      </div>

      {summary ? <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{summaryCards(summary).map((item) => <Card key={item.label} className="border-l-4 border-l-slate-300 p-4"><p className="text-xs font-semibold text-slate-600">{item.label}</p><p className="mt-1 text-2xl font-bold text-slate-950">{new Intl.NumberFormat("en-PH").format(item.value)}</p><StatusBadge className="mt-2" tone={item.tone}>{item.value === 1 ? "1 work order" : `${item.value} work orders`}</StatusBadge></Card>)}</div> : null}

      <Card className="overflow-hidden">
        <CardHeader
          title={isSla ? "Deadline watch" : "Operational work orders"}
          description={isSla ? "Filter the live work-order register for at-risk and overdue repairs." : "Filters are sent to the backend; the browser never loads the entire register to filter it locally."}
          action={<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ArrowUpDown className="size-3.5" aria-hidden="true" /> Server-side sort</span>}
        />
        <form onSubmit={(event) => { event.preventDefault(); navigate({ search: search.trim() || undefined }); }} className="border-b border-slate-200 bg-white p-4">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => { setSearch(""); navigate({ search: undefined }); }} placeholder="Search work-order reference" aria-label="Search work orders" className="max-w-xl" />
        </form>
        <FilterBar>
          <FilterSelect label="Priority" value={optionValue(filters.priority)} onChange={(event) => navigate({ priority: event.target.value || undefined })} options={[{ value: "", label: "All priorities" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
          <FilterSelect label="Repair status" value={optionValue(filters.status)} onChange={(event) => navigate({ status: event.target.value || undefined })} options={[{ value: "", label: "All work states" }, { value: "pending", label: "Pending assignment" }, { value: "accepted", label: "Accepted" }, { value: "in_progress", label: "In progress" }, { value: "completed", label: "Completed · provider review" }, { value: "rework_required", label: "Corrective work" }, { value: "provider_accepted", label: "Awaiting City Engineering" }, { value: "city_correction_required", label: "City return · provider coordination" }, { value: "verified", label: "Verified and closed" }]} />
          <FilterSelect label="Assignment state" value={optionValue(filters.assignmentStatus)} onChange={(event) => navigate({ assignmentStatus: event.target.value || undefined })} options={[{ value: "", label: "All assignments" }, { value: "unassigned", label: "Unassigned" }, { value: "pending", label: "Pending acceptance" }, { value: "accepted", label: "Accepted" }, { value: "declined", label: "Declined" }]} />
          <FilterSelect label="Repair progress" value={optionValue(filters.progress)} onChange={(event) => navigate({ progress: event.target.value || undefined })} options={[{ value: "", label: "All progress" }, { value: "0", label: "0%" }, { value: "25", label: "25%" }, { value: "50", label: "50%" }, { value: "75", label: "75%" }, { value: "100", label: "100% · completion submitted" }]} />
          <FilterSelect label="SLA state" value={optionValue(filters.slaState)} onChange={(event) => navigate({ slaState: event.target.value || undefined })} options={[{ value: "", label: "All SLA states" }, { value: "approaching", label: "Approaching deadline" }, { value: "overdue", label: "Overdue" }]} />
          <FilterSelect label="Sort work orders" value={optionValue(filters.sortBy)} onChange={(event) => navigate({ sortBy: event.target.value || "newest" })} options={[{ value: "newest", label: "Recently updated" }, { value: "oldest", label: "Oldest first" }, { value: "deadline", label: "Deadline first" }, { value: "-deadline", label: "Latest deadline" }, { value: "-priority", label: "Priority" }, { value: "-progress", label: "Progress" }]} />
          {hasFilters(filters) ? <button type="button" onClick={clearFilters} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Clear filters</button> : null}
        </FilterBar>

        {queue.workOrders.length ? <>
          <DataTable
            caption={isSla ? "SLA work-order monitor" : "Work-order register"}
            columns={columns}
            rows={queue.workOrders.map((workOrder) => ({
              id: workOrder.id,
              cells: {
                workOrder: <Link href={`/work-orders/${encodeURIComponent(workOrder.id)}`} className="font-semibold text-brand-700 hover:underline">{workOrder.reference}</Link>,
                incident: <div><p className="font-medium text-slate-900">{workOrder.incident?.reportNumber ?? "Incident unavailable"}</p><p className="mt-0.5 text-xs text-slate-500">{titleCase(workOrder.incident?.category, "Uncategorized")}</p></div>,
                location: <span className="block max-w-52 text-xs leading-5">{formatLocation(workOrder.incident?.location)}</span>,
                priority: <Badge tone={priorityTone(workOrder.priority)}>{titleCase(workOrder.priority)}</Badge>,
                organization: <span className="block max-w-40 text-xs leading-5">{workOrder.responsibleOrganization ?? "Not routed"}</span>,
                assignee: <div><p className="font-medium text-slate-900">{formatPerson(workOrder.assignee?.firstName, workOrder.assignee?.lastName)}</p>{workOrder.assignee?.team ? <p className="mt-0.5 text-xs text-slate-500">{workOrder.assignee.team}</p> : null}</div>,
                assignment: <StatusBadge tone={assignmentTone(workOrder.assignmentState)}>{titleCase(workOrder.assignmentState)}</StatusBadge>,
                repair: <StatusBadge tone={workOrderStatusTone(workOrder.status)}>{workOrder.status === "completed" ? "Completed · provider review" : workOrder.status === "provider_accepted" ? "Awaiting City Engineering" : workOrder.status === "verified" ? "Verified and closed" : titleCase(workOrder.status)}</StatusBadge>,
                progress: <ProgressBar value={workOrder.progressPercent} />,
                sla: <SlaBadges sla={workOrder.sla} includeDeadline />,
                updated: workOrder.updatedAt ? <span className="whitespace-nowrap text-xs text-slate-600">{formatDateTime(workOrder.updatedAt)}</span> : "—",
              },
            }))}
          />
          <Pagination page={queue.pagination.page} pages={queue.pagination.pages} total={queue.pagination.total} pageSize={queue.pagination.limit} onPageChange={(page) => navigate({ page: String(page) })} />
        </> : <EmptyState icon={hasFilters(filters) ? "search" : "records"} title={hasFilters(filters) ? "No work orders match these filters" : isSla ? "No SLA-tracked work orders" : "No work orders available"} description={hasFilters(filters) ? "Try removing a filter or search term. Server-side access controls still apply to every result." : isSla ? "Approaching and overdue work will appear here when operational records enter your authorized scope." : "City Engineering-routed incidents become work orders in the responsible Utility Provider organization."} action={hasFilters(filters) ? { label: "Clear filters", onClick: clearFilters } : undefined} />}
      </Card>
    </div>
  );
}
