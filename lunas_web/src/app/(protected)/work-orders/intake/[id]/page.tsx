import { notFound } from "next/navigation";
import { ProviderIncidentDetail } from "@/components/work-orders/provider-incident-detail";
import { BackendApiError } from "@/lib/api/backend.server";
import { requirePermission } from "@/lib/auth/dal.server";
import { getProviderIncident } from "@/lib/work-orders.server";

async function loadProviderIncident(id: string) {
  try {
    return await getProviderIncident(id);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) notFound();
    throw error;
  }
}

export default async function ProviderIncidentIntakeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("work_orders.manage");
  const { id } = await params;
  const incident = await loadProviderIncident(id);
  return <ProviderIncidentDetail incident={incident} />;
}
