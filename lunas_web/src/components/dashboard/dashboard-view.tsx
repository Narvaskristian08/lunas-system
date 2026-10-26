import { BarangayReportTable } from "@/components/dashboard/barangay-report-table";
import { ReportingAppealsCard } from "@/components/dashboard/reporting-appeals-card";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button, buttonStyles } from "@/components/ui/button";
import { DashboardGrid, SummaryCard } from "@/components/dashboard/dashboard-components";
import type { RealDashboardData } from "@/lib/dashboard.server";
import type { Severity, UserProfile } from "@/types";

function statusTone(status: string): Severity {
  const normalized = status.toLowerCase();
  if (normalized.includes("reject") || normalized.includes("overdue")) return "critical";
  if (normalized.includes("submitted") || normalized.includes("pending") || normalized.includes("awaiting") || normalized.includes("correction") || normalized.includes("rework")) return "warning";
  if (normalized.includes("verified") || normalized.includes("resolved") || normalized.includes("closed")) return "success";
  if (normalized.includes("progress") || normalized.includes("assigned") || normalized.includes("validated")) return "information";
  return "neutral";
}

function dashboardCopy(viewer: UserProfile) {
  if (viewer.backendRole === "utility_provider") {
    return {
      eyebrow: `${viewer.organization} · Provider Operations`,
      title: "Agency Operations",
      description: "Update routed reports through procurement, work progress, and completion.",
      recordsTitle: "Recent Agency Reports",
      recordsDescription: "Reports routed to your organization and their current status.",
    };
  }
  if (viewer.backendRole === "barangay_official") {
    return {
      eyebrow: `${viewer.organization} · Infrastructure Committee Review`,
      title: "Infrastructure Committee Dashboard",
      description: "Review citizen reports assigned to your barangay and forward validated incidents to City Engineering.",
      recordsTitle: "Reports Awaiting Review",
      recordsDescription: "Only reports in your assigned Barangay are shown here.",
    };
  }
  if (viewer.backendRole === "city_engineer") {
    return {
      eyebrow: "City Engineering · Citywide Operations",
      title: "Engineering Dashboard",
      description: "Review Barangay-validated reports, monitor provider repairs, and verify accepted completion before closure.",
      recordsTitle: "Reports and Repairs Awaiting City Engineering",
      recordsDescription: "Provider-approved repairs and Barangay-validated reports are linked to their review pages.",
    };
  }
  throw new Error("This web dashboard is only available to operational web roles");
}

export function DashboardView({ viewer, data }: { viewer: UserProfile; data: RealDashboardData }) {
  const copy = dashboardCopy(viewer);
  const providerFilters: Record<string, string> = {
    "New Agency Reports": "view=orders",
    "Work in Progress": "view=orders&status=in_progress",
    "Work Completed": "view=orders&status=completed",
    "Needs Correction": "status=needs_correction",
    "Overdue": "slaState=overdue",
  };
  const today = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(new Date());
  const engineeringFilters: Record<string, string> = {
    "Awaiting Review": "view=review",
    "Awaiting Verification": "view=verification",
    "Overdue": "view=orders&slaState=overdue",
  };

  return (
    <div className="mx-auto max-w-370">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600"><CalendarDays className="size-4" aria-hidden="true" /> {today}</span>}
      />

      <DashboardGrid className={viewer.backendRole === "utility_provider" || viewer.backendRole === "city_engineer" ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-4"}>
        {data.metrics.map((item) => viewer.backendRole === "utility_provider" || viewer.backendRole === "city_engineer"
          ? <Link key={item.label} href={`/work-orders?${viewer.backendRole === "city_engineer" ? engineeringFilters[item.label] : `view=orders&${providerFilters[item.label]}`}`} className="block rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-brand-700" aria-label={`${item.label}: ${item.value}. Open queue.`}><SummaryCard metric={item} /></Link>
          : <SummaryCard key={item.label} metric={item} />)}
      </DashboardGrid>

      {viewer.backendRole === "barangay_official" && data.reportingAppeals ? <ReportingAppealsCard initialAppeals={data.reportingAppeals} /> : null}

      <Card className="mt-6 overflow-hidden">
        <CardHeader title={copy.recordsTitle} description={copy.recordsDescription} />
        {data.records.length ? (
          <DataTable
            caption={copy.recordsTitle}
            columns={[
              { key: "report", label: "Report" },
              { key: "location", label: "Location" },
              { key: "priority", label: "Priority" },
              { key: "status", label: "Current Status" },
            ]}
            rows={data.records.map((record) => ({
              id: record.id,
              cells: {
                report: record.href
                  ? <Link href={record.href} className="font-semibold text-brand-700 hover:underline"><span>{record.id}</span><span className="mt-0.5 block text-xs font-normal text-slate-500">{record.category}</span></Link>
                  : <div><p className="font-semibold text-slate-900">{record.id}</p><p className="mt-0.5 text-xs text-slate-500">{record.category}</p></div>,
                location: record.location,
                priority: record.priority,
                status: <StatusBadge tone={record.statusTone ?? statusTone(record.status)}>{record.status}</StatusBadge>,
              },
            }))}
          />
        ) : (
          <EmptyState icon="records" title={data.emptyTitle} description={data.emptyDescription} />
        )}
        {viewer.backendRole === "barangay_official" && data.reviewPagination ? (
          <nav aria-label="Reports awaiting review pagination" className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
            <p className="text-sm text-slate-600">{data.reviewPagination.total} reports · {data.reviewPagination.pageSize} per page</p>
            <div className="flex items-center gap-2">
              {data.reviewPagination.page > 1 ? (
                <Link prefetch={false} scroll={false} href={`/dashboard?reviewPage=${data.reviewPagination.page - 1}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>Previous</Link>
              ) : <Button variant="secondary" size="sm" disabled>Previous</Button>}
              <span className="px-2 text-sm font-medium text-slate-600" aria-current="page">Page {data.reviewPagination.page} of {data.reviewPagination.pages}</span>
              {data.reviewPagination.page < data.reviewPagination.pages ? (
                <Link prefetch={false} scroll={false} href={`/dashboard?reviewPage=${data.reviewPagination.page + 1}`} className={buttonStyles({ variant: "secondary", size: "sm" })}>Next</Link>
              ) : <Button variant="secondary" size="sm" disabled>Next</Button>}
            </div>
          </nav>
        ) : null}
      </Card>
      {viewer.backendRole === "city_engineer" ? <div className="mt-6"><BarangayReportTable rows={data.barangayReports ?? []} /></div> : null}
    </div>
  );
}
