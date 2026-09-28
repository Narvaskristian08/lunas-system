import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal.server";

export default async function AdminPage() {
  await requirePermission("users.manage");
  redirect("/admin/users");
}
