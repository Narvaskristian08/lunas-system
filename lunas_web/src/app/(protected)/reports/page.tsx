import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function ReportsPage() { const viewer = await requirePermission("reports.view"); return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="routing" /> : <BarangayOperations module="reports" />; }
