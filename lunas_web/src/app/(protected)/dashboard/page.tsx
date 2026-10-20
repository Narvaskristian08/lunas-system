import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requirePermission, requireViewer } from "@/lib/auth/dal.server";
import { getRealDashboardData } from "@/lib/dashboard.server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Admin's first workspace is authorized account governance, not citywide
  // incident operations.
  const current = await requireViewer();
  if (current.backendRole === "admin") redirect("/admin/users");
  const viewer = await requirePermission("dashboard.view");
  const params = await searchParams;
  const requestedPage = typeof params.reviewPage === "string" ? Number(params.reviewPage) : 1;
  const reviewPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const data = await getRealDashboardData(viewer, reviewPage);
  return <DashboardView viewer={viewer} data={data} />;
}
