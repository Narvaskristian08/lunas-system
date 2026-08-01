import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { UtilityOperations } from "@/components/utility/utility-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function RepairsPage() { const viewer = await requirePermission("repairs.verify"); return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="repairs" /> : viewer.role === "Utility Provider" ? <UtilityOperations module="repairs" /> : <BarangayOperations module="repairs" />; }
