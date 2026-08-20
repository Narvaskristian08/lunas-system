import { CalendarDays } from "lucide-react";
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
  if (normalized.includes("submitted") || normalized.includes("pending")) return "warning";
  if (normalized.includes("complete") || normalized.includes("verified") || normalized.includes("closed")) return "success";
  if (normalized.includes("progress") || normalized.includes("assigned") || normalized.includes("validated")) return "information";
  return "neutral";
}

function dashboardCopy(viewer: UserProfile) {
  if (viewer.backendRole === "citizen") {
    return {
      eyebrow: "Citizen reporting",
      title: `Welcome, ${viewer.firstName}`,
      description: "Review the current status of infrastructure reports linked to your account.",
      recordsTitle: "My recent reports",
      recordsDescription: "Only reports you submitted are shown here.",
    };
  }
  if (viewer.backendRole === "repair_personnel") {
    return {
      eyebrow: `${viewer.organization} · Field operations`,
      title: "Repair dashboard",
      description: "Live work orders and deadline state assigned to your repair account.",
      recordsTitle: "Assigned work orders",
      recordsDescription: "Only work orders returned by the protected assignment scope are shown.",
    };
  }
  if (viewer.backendRole === "utility_provider") {
    return {
      eyebrow: `${viewer.organization} · Provider operations`,
      title: "Provider work orders",
      description: "Live maintenance activity routed to your responsible organization.",
      recordsTitle: "Recent work orders",
      recordsDescription: "Only records in the provider scope returned by the backend are shown.",
    };
  }
  return {
    eyebrow: `${viewer.organization} · Operations overview`,
    title: "LUNAS dashboard",
    description: "Current validation and maintenance activity from the LUNAS service, scoped to your authorized access.",
    recordsTitle: "Recent operational activity",
    recordsDescription: "Recent work orders or validation records in your authorized scope.",
  };
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
              { key: "status", label: "Current status" },
            ]}
            rows={data.records.map((record) => ({
              id: record.id,
              cells: {
                report: <div><p className="font-semibold text-slate-900">{record.id}</p><p className="mt-0.5 text-xs text-slate-500">{record.category}</p></div>,
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
