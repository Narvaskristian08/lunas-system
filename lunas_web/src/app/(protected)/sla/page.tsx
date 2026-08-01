import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { UtilityOperations } from "@/components/utility/utility-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function SlaPage() { const viewer = await requirePermission("sla.view"); return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="sla" /> : viewer.role === "Utility Provider" ? <UtilityOperations module="sla" /> : <BarangayOperations module="sla" />; }
