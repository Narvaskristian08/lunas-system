import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requirePermission } from "@/lib/auth/dal.server";
import { getRealDashboardData } from "@/lib/dashboard.server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await requirePermission("dashboard.view");
  const data = await getRealDashboardData(viewer);
  return <DashboardView viewer={viewer} data={data} />;
}
