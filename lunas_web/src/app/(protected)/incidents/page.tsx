import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { UtilityOperations } from "@/components/utility/utility-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function IncidentsPage() { const viewer = await requirePermission("incidents.view"); return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="incidents" /> : viewer.role === "Utility Provider" ? <UtilityOperations module="incidents" /> : <BarangayOperations module="incidents" />; }
