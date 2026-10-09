import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
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
      title: "Provider Work Orders",
      description: "Live maintenance activity routed to your responsible organization.",
      recordsTitle: "Recent Work Orders",
      recordsDescription: "Only records in the provider scope returned by the backend are shown.",
    };
  }
  if (viewer.backendRole === "barangay_official") {
    return {
      eyebrow: `${viewer.organization} · Barangay Review`,
      title: "Barangay Review Dashboard",
      description: "Review citizen reports assigned to your Barangay and forward validated incidents to City Engineering.",
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
  const today = new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(new Date());

  return (
    <div className="mx-auto max-w-[1480px]">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600"><CalendarDays className="size-4" aria-hidden="true" /> {today}</span>}
      />

      <DashboardGrid className="sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((item) => <SummaryCard key={item.label} metric={item} />)}
      </DashboardGrid>

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
                status: <StatusBadge tone={statusTone(record.status)}>{record.status}</StatusBadge>,
              },
            }))}
          />
        ) : (
          <EmptyState icon="records" title={data.emptyTitle} description={data.emptyDescription} />
        )}
      </Card>
    </div>
  );
}
