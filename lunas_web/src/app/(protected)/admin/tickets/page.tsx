import { PageHeader } from "@/components/layout/page-header";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { getAdminSupportTickets, type SupportTicketCategory, type SupportTicketPage, type SupportTicketStatus } from "@/lib/support-tickets.server";
import { AdminSupportTicketQueue } from "@/components/admin/support-ticket-queue";
import { BackendApiError } from "@/lib/api/backend.server";

const statuses = ["open", "in_progress", "resolved", "closed"] as const;
const categories = ["bug", "account_access", "data_issue", "feature_request", "other"] as const;

export default async function AdminSupportTicketsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; page?: string }> }) {
  await requirePermission("support.manage");
  const accessToken = await requireAccessToken();
  const filters = await searchParams;
  const status = statuses.includes(filters.status as SupportTicketStatus) ? filters.status as SupportTicketStatus : "";
  const category = categories.includes(filters.category as SupportTicketCategory) ? filters.category as SupportTicketCategory : "";
  const page = /^\d+$/.test(filters.page ?? "") ? Math.max(1, Number(filters.page)) : 1;
  let data: SupportTicketPage = { records: [], pagination: { page, limit: 10, total: 0, pages: 0 } };
  let error = "";
  try { data = await getAdminSupportTickets(accessToken, { page, status, category }); }
  catch (cause) { error = cause instanceof BackendApiError ? cause.message : "Support tickets could not be loaded. Refresh to retry."; }
  return <div className="mx-auto max-w-[1680px]">
    <PageHeader eyebrow="LUNAS · Administration" title="Support Tickets" description="Review bugs, access problems, data issues, and other concerns submitted by authorized web users." breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Support Tickets" }]} />
    <AdminSupportTicketQueue data={data} filters={{ status, category }} error={error} />
  </div>;
}
