import { MaintenanceConsole } from "@/components/maintenance/maintenance-console";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function MaintenanceSection({params}:{params:Promise<{segments:string[]}>}){await requirePermission("work_orders.manage");const {segments}=await params;return <MaintenanceConsole segments={segments}/>}
