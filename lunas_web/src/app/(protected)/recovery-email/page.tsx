import { redirect } from "next/navigation";
import { requireWebWorkspace } from "@/lib/auth/dal.server";

export default async function RecoveryEmailPage() {
  const viewer = await requireWebWorkspace();
  redirect(viewer.backendRole === "admin" ? "/admin/users" : "/dashboard");
}
