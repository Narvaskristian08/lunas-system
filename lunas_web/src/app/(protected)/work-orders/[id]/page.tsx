import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function WorkOrderPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("work_orders.view"); const { id } = await params; return <BarangayOperations module="work-orders" recordId={id} />; }
