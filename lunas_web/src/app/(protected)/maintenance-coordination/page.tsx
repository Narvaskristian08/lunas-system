import { MaintenanceConsole } from "@/components/maintenance/maintenance-console";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function MaintenancePage(){await requirePermission("work_orders.manage");return <MaintenanceConsole/>}
