import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) { const viewer = await requirePermission("incidents.view"); const { id } = await params; return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="incidents" recordId={id} /> : <BarangayOperations module="incidents" recordId={id} />; }
