import { notFound } from "next/navigation";
import { WorkOrderDetail } from "@/components/work-orders/work-order-detail";
import { BackendApiError } from "@/lib/api/backend.server";
import { requirePermission } from "@/lib/auth/dal.server";
import { getEligibleRepairPersonnel, getWorkOrder } from "@/lib/work-orders.server";

const officialRoles = new Set(["barangay_official", "city_engineer", "utility_provider", "admin"]);

export default async function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await requirePermission("work_orders.view");
  const { id } = await params;
  let workOrder;
  try {
    workOrder = await getWorkOrder(id);
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) notFound();
    throw error;
  }
  const canManage = officialRoles.has(viewer.backendRole) && viewer.permissions.includes("work_orders.manage") && workOrder.status !== "completed";
  const eligiblePersonnel = canManage
    ? await getEligibleRepairPersonnel(workOrder.id)
    : [];
  return <WorkOrderDetail viewer={viewer} workOrder={workOrder} eligiblePersonnel={eligiblePersonnel} />;
}
