import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal.server";

export default async function ProviderIncidentIntakePage() {
  await requirePermission("work_orders.manage");
  redirect("/work-orders?assignmentStatus=unassigned");
}
