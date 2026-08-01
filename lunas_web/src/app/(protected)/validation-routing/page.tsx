import { CityEngineeringOperations } from "@/components/city-engineering/city-engineering-operations";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function ValidationRoutingPage() { await requirePermission("reports.validate"); return <CityEngineeringOperations module="routing" />; }
