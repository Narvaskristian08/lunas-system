import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function SlaDetailPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("sla.view"); const { id } = await params; return <BarangayOperations module="sla" recordId={id} />; }
