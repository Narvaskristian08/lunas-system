import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requirePermission, requireViewer } from "@/lib/auth/dal.server";
import { getRealDashboardData } from "@/lib/dashboard.server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Admin's first workspace is authorized account governance, not citywide
  // incident operations.
  const current = await requireViewer();
  if (current.backendRole === "admin") redirect("/admin/users");
  const viewer = await requirePermission("dashboard.view");
  const data = await getRealDashboardData(viewer);
  return <DashboardView viewer={viewer} data={data} />;
}
