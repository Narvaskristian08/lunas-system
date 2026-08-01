import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { UtilityOperations } from "@/components/utility/utility-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function AnalyticsPage() { const viewer = await requirePermission("analytics.view"); return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="analytics" /> : viewer.role === "Utility Provider" ? <UtilityOperations module="analytics" /> : <BarangayOperations module="analytics" />; }
