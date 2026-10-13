import Link from "next/link";
import { WorkOrderList } from "@/components/work-orders/work-order-list";
import { ValidationQueue } from "@/components/validation/validation-queue";
import { requirePermission } from "@/lib/auth/dal.server";
import { getAwaitingAssignmentQueue, getProviderIncidentQueue, readProviderIncidentFilters, getWorkOrderSummary, getWorkOrders, readWorkOrderFilters } from "@/lib/work-orders.server";
import { getValidationQueue, getValidationSummary, readValidationFilters } from "@/lib/validation.server";

export default async function WorkOrdersPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requirePermission("work_orders.view");
  const params = await searchParams;
  if (viewer.backendRole !== "city_engineer") {
    const hasQueueSelection = params.view === "orders" || params.status || params.assignmentStatus || params.slaState;
    const filters = readWorkOrderFilters(viewer.backendRole === "utility_provider" && !hasQueueSelection
      ? { ...params, assignmentStatus: "unassigned" } : params);
    const [queue, summary] = await Promise.all([viewer.backendRole === "utility_provider" && filters.assignmentStatus === "unassigned" ? getAwaitingAssignmentQueue(filters) : getWorkOrders(filters), getWorkOrderSummary()]);
    const intakeFilters = readProviderIncidentFilters({});
    const intake = viewer.backendRole === "utility_provider" ? await getProviderIncidentQueue(intakeFilters) : undefined;
    return <WorkOrderList viewer={viewer} queue={queue} filters={filters} summary={summary} intake={intake} />;
  }
  const view = params.view === "confirmed" ? "confirmed" : params.view === "review" ? "review" : params.view === "verification" ? "verification" : params.view === "orders" || params.status || params.slaState || params.assignmentStatus ? "orders" : "review";
  const [summary, validationSummary] = await Promise.all([
    getWorkOrderSummary(), getValidationSummary().catch(() => undefined),
  ]);
  const filters = readWorkOrderFilters(view === "verification" ? { ...params, status: "provider_accepted" } : params);
  const reviewFilters = readValidationFilters(params);
  const content = view === "review" || view === "confirmed"
    ? <ValidationQueue key={view + JSON.stringify(reviewFilters)} viewer={viewer} queue={await getValidationQueue(reviewFilters, view === "confirmed" ? "confirmed" : undefined)} filters={reviewFilters} embedded confirmed={view === "confirmed"} />
    : <WorkOrderList key={view} viewer={viewer} queue={await getWorkOrders(filters)} filters={filters} workspaceView={view} />;
  const cards = [
    { label: "Awaiting Review", value: validationSummary?.pending, href: "/work-orders?view=review", selected: view === "review" },
    { label: "Priority & Routing", value: validationSummary?.validated, href: "/work-orders?view=confirmed", selected: view === "confirmed" },
    { label: "Awaiting Verification", value: summary?.awaitingFinalVerification, href: "/work-orders?view=verification", selected: view === "verification" },
    { label: "Closed Orders", value: summary?.closed, href: "/work-orders?status=verified", selected: view === "orders" && filters.status === "verified" && !filters.slaState },
  ];
  return <div className="mx-auto max-w-[1680px]">
    <header className="mb-6"><p className="text-xs font-semibold text-brand-700">City Engineering</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Maintenance</h1><p className="mt-2 text-sm text-slate-600">Review incidents, monitor repairs, and verify completed work.</p></header>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(card => <Link key={card.label} href={card.href} aria-current={card.selected ? "page" : undefined} className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700 ${card.selected ? "border-brand-700 ring-2 ring-brand-700" : "border-slate-200"}`}><p className="text-sm font-medium text-slate-600">{card.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{card.value ?? "—"}</p></Link>)}</div>

    {content}
  </div>;
}
