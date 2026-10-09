import Link from "next/link";
import { WorkOrderList } from "@/components/work-orders/work-order-list";
import { ValidationQueue } from "@/components/validation/validation-queue";
import { requirePermission } from "@/lib/auth/dal.server";
import { getWorkOrderSummary, getWorkOrders, readWorkOrderFilters } from "@/lib/work-orders.server";
import { getValidationQueue, getValidationSummary, readValidationFilters } from "@/lib/validation.server";

export default async function WorkOrdersPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requirePermission("work_orders.view");
  const params = await searchParams;
  if (viewer.backendRole !== "city_engineer") {
    const filters = readWorkOrderFilters(params);
    const [queue, summary] = await Promise.all([getWorkOrders(filters), getWorkOrderSummary()]);
    return <WorkOrderList viewer={viewer} queue={queue} filters={filters} summary={summary} />;
  }
  const view = params.view === "review" ? "review" : params.view === "verification" ? "verification" : "orders";
  const [summary, validationSummary] = await Promise.all([
    getWorkOrderSummary(), getValidationSummary().catch(() => undefined),
  ]);
  const filters = readWorkOrderFilters(view === "verification" ? { ...params, status: "provider_accepted" } : params);
  const reviewFilters = readValidationFilters(params);
  const content = view === "review"
    ? <ValidationQueue key={JSON.stringify(reviewFilters)} viewer={viewer} queue={await getValidationQueue(reviewFilters)} filters={reviewFilters} embedded />
    : <WorkOrderList key={view} viewer={viewer} queue={await getWorkOrders(filters)} filters={filters} workspaceView={view} />;
  const cards = [
    { label: "Awaiting Review", value: validationSummary?.pending, href: "/work-orders?view=review", selected: view === "review" },
    { label: "Active Repairs", value: summary?.active, href: "/work-orders?status=in_progress", selected: view === "orders" && filters.status === "in_progress" && !filters.slaState },
    { label: "Approaching Deadline", value: summary?.approaching, href: "/work-orders?slaState=approaching", selected: view === "orders" && filters.slaState === "approaching" },
    { label: "Overdue", value: summary?.overdue, href: "/work-orders?slaState=overdue", selected: view === "orders" && filters.slaState === "overdue" },
    { label: "Awaiting Verification", value: summary?.awaitingFinalVerification, href: "/work-orders?view=verification", selected: view === "verification" },
    { label: "Closed Orders", value: summary?.closed, href: "/work-orders?status=verified", selected: view === "orders" && filters.status === "verified" && !filters.slaState },
  ];
  return <div className="mx-auto max-w-[1680px]">
    <header className="mb-6"><p className="text-xs font-semibold text-brand-700">City Engineering</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Maintenance</h1><p className="mt-2 text-sm text-slate-600">Review incidents, monitor repairs, and verify completed work.</p></header>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{cards.map(card => <Link key={card.label} href={card.href} aria-current={card.selected ? "page" : undefined} className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700 ${card.selected ? "border-brand-700 ring-2 ring-brand-700" : "border-slate-200"}`}><p className="text-sm font-medium text-slate-600">{card.label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{card.value ?? "—"}</p></Link>)}</div>

    {content}
  </div>;
}
