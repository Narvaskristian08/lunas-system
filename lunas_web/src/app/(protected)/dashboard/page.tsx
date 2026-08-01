import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { dashboardByRole } from "@/lib/mock-data";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const viewer = await requirePermission("dashboard.view");
  return <DashboardView viewer={viewer} config={dashboardByRole[viewer.role]} />;
}
