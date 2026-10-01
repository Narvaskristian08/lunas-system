import { ProviderIncidentQueue } from "@/components/work-orders/provider-incident-queue";
import { requirePermission } from "@/lib/auth/dal.server";
import { getProviderIncidentQueue, readProviderIncidentFilters } from "@/lib/work-orders.server";

export default async function ProviderIncidentIntakePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("work_orders.manage");
  const filters = readProviderIncidentFilters(await searchParams);
  const queue = await getProviderIncidentQueue(filters);
  return <ProviderIncidentQueue queue={queue} filters={filters} />;
}
