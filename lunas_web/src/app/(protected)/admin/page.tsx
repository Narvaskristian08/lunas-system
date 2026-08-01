import { AdminConsole } from "@/components/admin/admin-console";
import { requirePermission } from "@/lib/auth/dal.server";
export default async function AdminPage(){await requirePermission("users.manage");return <AdminConsole/>}
