import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UnauthorizedState } from "@/components/auth/unauthorized-state";
import { requireViewer } from "@/lib/auth/dal.server";

export const metadata: Metadata = { title: "Restricted Access" };

const safeContexts: Record<string, string> = {
  users: "User and account administration",
  settings: "System configuration",
  validation: "Report validation",
  assignment: "Incident assignment",
  repairs: "Repair coordination and verification",
  sla: "SLA monitoring",
  record: "A protected LUNAS record",
};

export default async function UnauthorizedPage({
  searchParams,
}: {
  searchParams: Promise<{ context?: string | string[] }>;
}) {
  const viewer = await requireViewer();
  const params = await searchParams;
  const key = Array.isArray(params.context) ? params.context[0] : params.context;
  const context = key ? safeContexts[key] ?? "A protected LUNAS page or action" : "A protected LUNAS page or action";
  if (!viewer) redirect("/login");
  return <UnauthorizedState role={viewer.role} context={context} />;
}
