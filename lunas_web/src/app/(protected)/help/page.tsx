import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { getMySupportTickets, type SupportTicketPage } from "@/lib/support-tickets.server";
import { SupportTicketCenter } from "@/components/support/support-ticket-center";
import { BackendApiError } from "@/lib/api/backend.server";

export const metadata: Metadata = { title: "Help and Support" };

export default async function HelpPage() {
  await requirePermission("support.create");
  const accessToken = await requireAccessToken();
  let data: SupportTicketPage = { records: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
  let error = "";
  try {
    data = await getMySupportTickets(accessToken);
  } catch (cause) {
    error = cause instanceof BackendApiError ? cause.message : "Support tickets could not be loaded. Refresh to retry.";
  }
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Account support"
        title="Help and Support"
        description="Report a bug, account problem, data issue, or other concern directly to LUNAS administrators."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Help and Support" }]}
      />
      <SupportTicketCenter initialData={data} initialError={error} />
    </div>
  );
}
