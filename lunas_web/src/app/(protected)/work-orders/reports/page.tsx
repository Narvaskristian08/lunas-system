import { CategorySummary } from "@/components/reports/category-summary";
import { reportAnchor, reportDate } from "@/lib/report-export";
import { ReportExportActions } from "@/components/reports/report-export-actions";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal.server";
import { getAgencyReports } from "@/lib/validation.server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";

const label = (value?: string) => (value || "unknown").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function AgencyReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const viewer = await requirePermission("work_orders.view");
  const period = params.period === "daily" || params.period === "weekly" ? params.period : "monthly";
  const date = reportAnchor(params.date)?.toISOString().slice(0, 10);
  const reports = await getAgencyReports(period, date);
  return <div className="mx-auto max-w-6xl space-y-6">
    <div><p className="text-sm font-semibold text-brand-700">Agency Workflow</p><h1 className="mt-1 text-3xl font-bold text-slate-950">Agency Reports</h1><p className="mt-2 text-slate-600">Reports submitted and routed to {viewer.organization || "your agency"}. Only your agency’s reports are included.</p>
      <div className="mt-4 flex flex-wrap gap-2">{(["daily", "weekly", "monthly"] as const).map((value) => <Link key={value} href={`/work-orders/reports?period=${value}${date ? `&date=${date}` : ""}`} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${period === value ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{label(value)}</Link>)}<ReportExportActions basePath="/work-orders/reports" period={period} date={date} /></div>
    </div>
    <CategorySummary reports={reports} period={period} date={date} /><Card><CardHeader title={`${reports.length} report${reports.length === 1 ? "" : "s"}`} />{reports.length ? <div className="divide-y divide-slate-200">{reports.map((value) => { const item = value as { _id?: string; id?: string; reportNumber?: string; category?: string; description?: string; status?: string; agencyStatus?: string; createdAt?: string; location?: { address?: { barangay?: string } } }; const id = item._id || item.id || ""; return <Link key={id} href={`/work-orders/intake/${id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-slate-50"><div><p className="font-semibold text-slate-950">{item.reportNumber || "Report"}</p><p className="mt-1 text-sm text-slate-600">{label(item.category)} · {item.location?.address?.barangay || "Barangay unavailable"}</p><p className="mt-1 max-w-3xl text-sm text-slate-500">{item.description || "No description"}</p><p className="mt-1 text-xs text-slate-400">{item.createdAt ? reportDate(item.createdAt) : ""}</p></div><Badge tone={item.status === "closed" || item.status === "resolved" ? "success" : "neutral"}>{label(item.agencyStatus || item.status)}</Badge></Link>; })}</div> : <p className="p-5 text-sm text-slate-600">No agency reports were submitted in this period.</p>}</Card>
  </div>;
}
