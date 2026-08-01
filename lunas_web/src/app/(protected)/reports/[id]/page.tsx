import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) { await requirePermission("reports.view"); const { id } = await params; return <BarangayOperations module="reports" recordId={id} />; }
