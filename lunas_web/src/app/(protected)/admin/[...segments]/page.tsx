import { AdminConsole } from "@/components/admin/admin-console";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function AdminSection({params}:{params:Promise<{segments:string[]}>}){await requirePermission("users.manage");const {segments}=await params;return <AdminConsole segments={segments}/>}
