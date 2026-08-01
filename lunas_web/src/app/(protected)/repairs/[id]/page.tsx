import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function RepairPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("repairs.verify"); const { id } = await params; return <BarangayOperations module="repairs" recordId={id} />; }
