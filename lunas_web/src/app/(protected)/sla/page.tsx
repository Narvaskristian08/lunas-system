import { WorkOrderList } from "@/components/work-orders/work-order-list";
import { requirePermission } from "@/lib/auth/dal.server";
import { getWorkOrderSummary, getWorkOrders, readWorkOrderFilters } from "@/lib/work-orders.server";

export default async function SlaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requirePermission("sla.view");
  const filters = readWorkOrderFilters(await searchParams);
  const [queue, summary] = await Promise.all([
    getWorkOrders(filters),
    getWorkOrderSummary(),
  ]);
  return <WorkOrderList viewer={viewer} queue={queue} filters={filters} summary={summary} mode="sla" />;
}
