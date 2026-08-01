import { BarangayOperations } from "@/components/barangay/barangay-operations";
import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { UtilityOperations } from "@/components/utility/utility-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function WorkOrdersPage() { const viewer = await requirePermission("work_orders.view"); return viewer.role === "City Engineering Office" ? <CityEngineeringOperations module="work-orders" /> : viewer.role === "Utility Provider" ? <UtilityOperations module="work-orders" /> : <BarangayOperations module="work-orders" />; }
