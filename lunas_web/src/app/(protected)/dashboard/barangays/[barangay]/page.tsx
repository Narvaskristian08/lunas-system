import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { backendRequest, responseData } from "@/lib/api/backend.server";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatDateTime } from "@/lib/utils";
import { titleCase, priorityTone } from "@/components/work-orders/work-order-ui";
import { Badge } from "@/components/ui/badge";

type Report = { _id: string; reportNumber: string; category: string; description?: string; status: string; priority?: string; location?: { address?: { street?: string; city?: string } }; sla?: { deadline?: string }; createdAt?: string };
type Result = { barangay: string; reports: Report[]; counts: Record<string, number>; pagination: { page: number; total: number; pages: number } };

export default async function BarangayReportsPage({ params, searchParams }: { params: Promise<{ barangay: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requirePermission("reports.view");
  if (viewer.backendRole !== "city_engineer") redirect("/unauthorized");
  const { barangay: encodedBarangay } = await params;
  const barangay = decodeURIComponent(encodedBarangay);
  const input = await searchParams;
  const state = typeof input.state === "string" && ["ongoing", "overdue", "resolved"].includes(input.state) ? input.state : "all";
  const search = typeof input.search === "string" ? input.search.slice(0, 100) : "";
  const page = typeof input.page === "string" ? input.page : "1";
  const query = new URLSearchParams({ barangay, state, search, page });
  const data = responseData(await backendRequest<Result>(`/stats/barangay-report-list?${query}`, { accessToken: await requireAccessToken() }));
  const base = `/dashboard/barangays/${encodeURIComponent(barangay)}`;
  const href = (selected: string, number = 1) => `${base}?${new URLSearchParams({ state: selected, search, page: String(number) })}`;
  const terminal = ["verified", "resolved", "closed", "rejected", "duplicate"];
  return <div className="mx-auto max-w-[1480px]">
    <Link href="/dashboard" className="text-sm font-semibold text-brand-700 hover:underline">← Engineering Dashboard</Link>
    <header className="my-6"><p className="text-xs font-semibold text-brand-700">Barangay Reports · View Only</p><h1 className="mt-1 text-3xl font-bold text-slate-950">{data.barangay}</h1><p className="mt-2 text-sm text-slate-600">Check reported issues, ongoing work, deadlines, and resolved reports.</p></header>
    <Card className="overflow-hidden"><CardHeader title="Barangay Report Register" />
      <form className="flex flex-wrap gap-3 border-b border-slate-200 p-5" action={base}><select name="state" aria-label="Filter report status" defaultValue={state} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">All Reports</option><option value="ongoing">Ongoing</option><option value="overdue">Overdue</option><option value="resolved">Resolved</option></select><input name="search" aria-label="Search report reference" defaultValue={search} placeholder="Search report reference" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm" /><button className="rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white">Search</button></form>
      <DataTable caption="Barangay reports" className="max-h-[60dvh] overflow-auto [&_thead]:sticky [&_thead]:top-0 [&_td]:align-top" columns={[{ key: "report", label: "Report" }, { key: "location", label: "Location" }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" }, { key: "deadline", label: "Deadline" }, { key: "submitted", label: "Submitted" }]} rows={data.reports.map(report => ({ id: report._id, cells: {
        report: <div><p className="whitespace-nowrap font-semibold text-slate-900">{report.reportNumber}</p><p className="mt-1 text-xs text-slate-500">{titleCase(report.category)}</p>{report.description ? <details className="mt-2 max-w-sm text-sm"><summary className="cursor-pointer text-brand-700">View Description</summary><p className="mt-2 whitespace-pre-wrap text-slate-600">{report.description}</p></details> : null}</div>,
        location: <p className="max-w-64 text-sm leading-6">{[report.location?.address?.street, data.barangay, report.location?.address?.city].filter(Boolean).join(", ")}</p>,
        status: <div className="flex flex-col items-start gap-2"><Badge tone={["verified", "resolved", "closed"].includes(report.status) ? "success" : "information"}>{["verified", "resolved", "closed"].includes(report.status) ? "Resolved" : titleCase(report.status)}</Badge>{!terminal.includes(report.status) && report.sla?.deadline && new Date(report.sla.deadline).getTime() < Date.now() ? <Badge tone="critical">Overdue</Badge> : null}</div>,
        priority: <Badge tone={priorityTone(report.priority)}>{titleCase(report.priority, "Not Prioritized")}</Badge>,
        deadline: report.sla?.deadline ? <div><p className="text-xs">{formatDateTime(report.sla.deadline)}</p></div> : "—",
        submitted: report.createdAt ? <span className="text-xs">{formatDateTime(report.createdAt)}</span> : "—",
      } }))} />
      {!data.reports.length ? <p className="p-6 text-sm text-slate-500">No reports match this view.</p> : null}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4 text-sm text-slate-600"><span>{data.pagination.total} reports · Page {data.pagination.page} of {data.pagination.pages}</span><div className="flex gap-4">{data.pagination.page > 1 ? <Link href={href(state, data.pagination.page - 1)} className="text-brand-700">Previous</Link> : null}{data.pagination.page < data.pagination.pages ? <Link href={href(state, data.pagination.page + 1)} className="text-brand-700">Next</Link> : null}</div></footer>
    </Card>
  </div>;
}
