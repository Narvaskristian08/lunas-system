"use client";

import { categoryLabel } from "@/lib/category-label";

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
import type { ProviderIncidentQueueData, WorkOrderFilters, WorkOrderQueueData, WorkOrderSummary } from "@/lib/work-orders.server";
import { assignmentLabel, assignmentTone, formatLocation, formatPerson, priorityTone, SlaBadges, titleCase, workOrderStatusTone, workOrderStatusLabel } from "@/components/work-orders/work-order-ui";
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

function summaryCards(summary: WorkOrderSummary, role: UserProfile["backendRole"], isSla: boolean) {
  const cards = {
    unassigned: { label: "Pending Repairs", value: summary.unassigned },
    pendingRepairs: { label: "Assigned Repairs", value: summary.accepted },
    pending: { label: "Pending Acceptance", value: summary.pendingAcceptance },
    active: { label: "Active Repairs", value: summary.active },
    approaching: { label: "Approaching Deadline", value: summary.approaching },
    overdue: { label: "Overdue", value: summary.overdue },
    providerReview: { label: "Awaiting Review", value: summary.readyForCompletion + (role === "repair_personnel" ? summary.awaitingFinalVerification : 0) },
    cityVerification: { label: "Awaiting Verification", value: summary.awaitingFinalVerification },
    cityCorrections: { label: "Returned for Correction", value: summary.cityCorrections },
    corrective: { label: "Needs Correction", value: summary.correctiveRepairs + (["utility_provider", "repair_personnel"].includes(role) ? summary.cityCorrections : 0) },
  };
  if (isSla) return [cards.active, cards.approaching, cards.overdue];
  if (role === "city_engineer") {
    return [cards.cityVerification, cards.active, cards.approaching, cards.overdue];
  }
  if (role === "utility_provider") {
    return [cards.unassigned, cards.pendingRepairs, cards.active, cards.corrective, cards.providerReview];
  }
  if (role === "repair_personnel") {
    return [cards.pending, cards.active, cards.corrective, cards.approaching, cards.overdue];
  }
  return Object.values(cards);
}

export function WorkOrderList({
  viewer,
  queue,
  filters,
  summary,
  mode = "work-orders",
  workspaceView,
  intake,
}: {
  viewer: UserProfile;
  queue: WorkOrderQueueData;
  filters: WorkOrderFilters;
  summary?: WorkOrderSummary;
  intake?: ProviderIncidentQueueData;
  mode?: "work-orders" | "sla";
  workspaceView?: "orders" | "verification";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search ?? "");
  const isSla = mode === "sla";
  const title = isSla ? "SLA Monitor" : "Work Orders";
  const description = isSla
    ? "Backend-calculated deadlines and repair status for work orders in your authorized scope."
    : viewer.backendRole === "repair_personnel"
      ? "Only work orders assigned to you are shown."
      : viewer.backendRole === "city_engineer"
        ? "Monitor provider repairs, review completed work, and track deadlines across the city."
        : viewer.backendRole === "utility_provider"
          ? "Assign repairs to your team, review completed work, and manage deadlines."
          : "Create, assign, and monitor maintenance work within your authorized scope.";

  const workStateOptions = viewer.backendRole === "city_engineer"
    ? [
      { value: "", label: "All Repair States" },
      { value: "in_progress", label: "Active Repairs" },
      { value: "completed", label: "Awaiting Provider Review" },
      { value: "provider_accepted", label: "Awaiting Final Verification" },
      { value: "city_correction_required", label: "Returned to Provider" },
      { value: "verified", label: "Closed" },
    ]
    : [
      { value: "", label: "All Work States" },
      { value: "pending", label: "Pending Assignment" },
      { value: "accepted", label: "Assigned Repairs" },
      { value: "in_progress", label: "Active Repairs" },
      { value: "completed", label: "Awaiting Provider Review" },
      { value: ["utility_provider", "repair_personnel"].includes(viewer.backendRole) ? "needs_correction" : "rework_required", label: "Needs Correction" },
      { value: "provider_accepted", label: "Awaiting City Verification" },
      ...(!["utility_provider", "repair_personnel"].includes(viewer.backendRole) ? [{ value: "city_correction_required", label: "Returned to Provider" }] : []),
      { value: "verified", label: "Closed" },
    ];

  const navigate = (patch: QueryPatch) => {
    const next = new URLSearchParams();
    if (workspaceView) next.set("view", workspaceView);
    else if (viewer.backendRole === "utility_provider") next.set("view", "orders");
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
      status: workspaceView === "verification" ? "provider_accepted" : undefined,
      priority: undefined,
      assignmentStatus: undefined,
      progress: undefined,
      slaState: workspaceView ? filters.slaState : undefined,
      personnel: undefined,
      organization: undefined,
      category: undefined,
      sortBy: "newest",
    });
  };

  const hasRefinements = hasFilters(workspaceView ? { ...filters, status: undefined, slaState: undefined } : filters);
  const isClosedQueue = Boolean(workspaceView && filters.status === "verified");
  const queueTitle = isClosedQueue ? "Closed Orders" : workspaceView === "verification" ? "Awaiting Verification"
    : workspaceView && filters.slaState === "approaching" ? "Approaching Deadline"
    : workspaceView && filters.slaState === "overdue" ? "Overdue Repairs"
    : workspaceView && filters.status === "in_progress" ? "Active Repairs"
    : filters.assignmentStatus === "unassigned" ? "Pending Repairs"
    : filters.slaState === "approaching" ? "Approaching Deadline"
    : filters.slaState === "overdue" ? "Overdue Repairs"
    : filters.status === "accepted" ? "Assigned Repairs"
    : filters.status === "in_progress" ? "Active Repairs"
    : ["completed", "awaiting_review"].includes(filters.status ?? "") ? "Awaiting Review"
    : filters.status === "city_correction_required" ? "Returned for Correction"
    : ["rework_required", "needs_correction"].includes(filters.status ?? "") ? "Needs Correction"
    : "Operational Work Orders";

  const columns = [
    { key: "workOrder", label: "Work Order / Incident", className: "w-[22%] min-w-64" },
    { key: "location", label: "Location", className: "w-[17%] min-w-48" },
    { key: "assignee", label: "Responsibility", className: "w-[20%] min-w-56" },
    { key: "repair", label: "Status / Priority", className: "w-[16%] min-w-48" },
    { key: "sla", label: isClosedQueue ? "Closed At" : "Deadline", className: "w-[15%] min-w-48" },
    { key: "updated", label: "Last Updated", className: "w-[10%] min-w-40" },
  ];

  return (
    <div className="mx-auto max-w-[1680px]">
      {!workspaceView ? <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold tracking-normal text-brand-700">{isSla ? "Maintenance operations · Deadline control" : "Maintenance operations · Command center"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {!isSla && viewer.permissions.includes("reports.view") ? <Link href="/validation-routing" className={buttonStyles({ variant: "secondary" })}><ClipboardList className="size-4" aria-hidden="true" /> Open Validation Queue</Link> : null}
      </div> : null}

      {summary && !workspaceView ? (
        <>
        <p className="mb-2 text-xs text-slate-500">Overall totals for your authorized scope</p>
        <div className={`mb-6 grid gap-3 sm:grid-cols-2 ${viewer.backendRole === "city_engineer" && !isSla ? "xl:grid-cols-4" : viewer.backendRole === "utility_provider" && !isSla ? "xl:grid-cols-5" : "xl:grid-cols-3"}`}>
          {summaryCards(summary, viewer.backendRole, isSla).map((item) => {
            const provider = viewer.backendRole === "utility_provider" && !isSla;
            const cardFilter: QueryPatch = item.label === "Pending Repairs" ? { assignmentStatus: "unassigned" }
              : item.label === "Assigned Repairs" ? { status: "accepted" }
              : item.label === "Active Repairs" ? { status: "in_progress" }
              : item.label === "Awaiting Review" ? { status: viewer.backendRole === "utility_provider" ? "completed" : "awaiting_review" }
              : item.label === "Returned for Correction" ? { status: "city_correction_required" }
              : item.label === "Needs Correction" ? { status: "needs_correction" }
              : item.label === "Approaching Deadline" ? { slaState: "approaching" }
              : item.label === "Overdue" ? { slaState: "overdue" } : {};
            const selected = provider && Object.entries(cardFilter).every(([key, value]) => ({ status: filters.status, assignmentStatus: filters.assignmentStatus, slaState: filters.slaState } as QueryPatch)[key] === value)
              && (cardFilter.status || !filters.status) && (cardFilter.assignmentStatus || !filters.assignmentStatus);
            const content = <><p className="text-sm font-medium text-slate-600">{item.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{new Intl.NumberFormat("en-PH").format(item.value + (item.label === "Pending Repairs" ? intake?.pagination.total ?? 0 : 0))}</p></>;
            return provider ? <button key={item.label} type="button" aria-pressed={Boolean(selected)} onClick={() => navigate({ status: undefined, assignmentStatus: undefined, ...cardFilter })} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700 ${selected ? "border-brand-700 ring-2 ring-brand-700" : "border-slate-200"}`}>{content}</button>
              : <Card key={item.label} className="p-4">{content}</Card>;
          })}
        </div>
        </>
      ) : null}


      <Card className="overflow-hidden">
        <CardHeader
          title={isSla ? "Deadline Watch" : queueTitle}
          description={isSla ? "Filter the live work-order register for at-risk and overdue repairs." : "Track repairs, assignments, and deadlines across your authorized area."}
          action={workspaceView || viewer.backendRole === "utility_provider" ? <Link href="/work-orders?view=orders" className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">All Work Orders</Link> : <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><ArrowUpDown className="size-3.5" aria-hidden="true" /> Sort and Filter</span>}
        />
        <form onSubmit={(event) => { event.preventDefault(); navigate({ search: search.trim() || undefined }); }} className="border-b border-slate-200 bg-white p-4">
          <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => { setSearch(""); navigate({ search: undefined }); }} placeholder="Search report or work-order reference" aria-label="Search Work Orders" className="max-w-xl" />
        </form>
        <FilterBar>
          <FilterSelect label="Priority" value={optionValue(filters.priority)} onChange={(event) => navigate({ priority: event.target.value || undefined })} options={[{ value: "", label: "All Priorities" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
          {!workspaceView && viewer.backendRole !== "utility_provider" ? <FilterSelect label="Repair Status" value={optionValue(filters.status)} onChange={(event) => navigate({ status: event.target.value || undefined })} options={workStateOptions} /> : null}
          {!workspaceView && viewer.backendRole !== "utility_provider" ? <FilterSelect label="Assignment State" value={optionValue(filters.assignmentStatus)} onChange={(event) => navigate({ assignmentStatus: event.target.value || undefined })} options={[{ value: "", label: "All Assignments" }, { value: "unassigned", label: "Pending" }, { value: "accepted", label: "Assigned" }]} /> : null}
          {!workspaceView ? <FilterSelect label="SLA State" value={optionValue(filters.slaState)} onChange={(event) => navigate({ slaState: event.target.value || undefined })} options={[{ value: "", label: "All SLA States" }, { value: "approaching", label: "Approaching Deadline" }, { value: "overdue", label: "Overdue" }]} /> : null}
          <FilterSelect label="Sort Work Orders" value={optionValue(filters.sortBy)} onChange={(event) => navigate({ sortBy: event.target.value || "newest" })} options={[{ value: "newest", label: "Recently Updated" }, { value: "oldest", label: "Oldest First" }, { value: "deadline", label: "Deadline First" }, { value: "-deadline", label: "Latest Deadline" }, { value: "-priority", label: "Priority" }]} />
          {hasRefinements && viewer.backendRole !== "utility_provider" ? <button type="button" onClick={clearFilters} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Clear Filters</button> : null}
        </FilterBar>

        {queue.workOrders.length ? <>
          <DataTable
            className="max-h-[60dvh] overflow-auto overscroll-contain [&_table]:min-w-300 [&_table]:table-fixed [&_td]:align-top [&_td]:py-5 [&_th]:whitespace-nowrap [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-slate-50"
            caption={isSla ? "SLA work-order monitor" : "Work-order register"}
            columns={columns}
            rows={queue.workOrders.map((workOrder) => ({
              id: workOrder.id,
              cells: {
                workOrder: <div className="space-y-2">
                  <Link href={workOrder.intakeIncidentId ? `/work-orders/intake/${encodeURIComponent(workOrder.intakeIncidentId)}` : `/work-orders/${encodeURIComponent(workOrder.id)}`} className="block whitespace-nowrap text-sm font-semibold text-brand-700 hover:underline">{workOrder.reference}</Link>
                  <p className="text-sm font-medium text-slate-800">{categoryLabel(workOrder.incident?.category, "Uncategorized")}</p>
                  <p className="whitespace-nowrap text-xs text-slate-500">{workOrder.intakeIncidentId ? "Create Work Order & Assign" : workOrder.incident?.reportNumber ?? "Incident unavailable"}</p>
                </div>,
                location: <p className="line-clamp-3 text-sm leading-6 text-slate-600" title={formatLocation(workOrder.incident?.location)}>{formatLocation(workOrder.incident?.location)}</p>,
                assignee: <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-900">{formatPerson(workOrder.assignee?.firstName, workOrder.assignee?.lastName)}</p>
                  <p className="text-xs leading-5 text-slate-600">{workOrder.responsibleOrganization ?? "Not routed"}{workOrder.assignee?.team ? ` · ${workOrder.assignee.team}` : ""}</p>
                  <Badge tone={assignmentTone(workOrder.assignmentState)}>{assignmentLabel(workOrder.assignmentState)}</Badge>
                </div>,
                repair: <div className="flex flex-col items-start gap-2">
                  <StatusBadge tone={workOrderStatusTone(workOrder.status)}>{workOrderStatusLabel(workOrder.status, workOrder.assignmentState)}</StatusBadge>
                  <Badge tone={priorityTone(workOrder.priority)}>{titleCase(workOrder.priority)} Priority</Badge>
                </div>,
                sla: isClosedQueue ? <span className="text-sm text-slate-600">{workOrder.closedAt ? formatDateTime(workOrder.closedAt) : "Unavailable"}</span> : <div className="[&>div]:flex-col [&>div]:items-start [&>div]:gap-2"><SlaBadges sla={workOrder.sla} includeDeadline /></div>,
                updated: workOrder.updatedAt ? <span className="block text-xs leading-5 text-slate-500">{formatDateTime(workOrder.updatedAt)}</span> : "—",
              },
            }))}
          />
          <Pagination page={queue.pagination.page} pages={queue.pagination.pages} total={queue.pagination.total} pageSize={queue.pagination.limit} onPageChange={(page) => navigate({ page: String(page) })} />
        </> : <EmptyState icon={hasRefinements ? "search" : "records"} title={hasRefinements ? "No work orders match these filters" : isSla ? "No SLA-tracked work orders" : "No work orders available"} description={hasRefinements ? "Try another filter or search term." : isSla ? "Work orders approaching or past their deadlines will appear here." : "City Engineering-routed incidents become work orders in the responsible Utility Provider organization."} action={hasRefinements && viewer.backendRole !== "utility_provider" ? { label: "Clear Filters", onClick: clearFilters } : undefined} />}
      </Card>
    </div>
  );
}
