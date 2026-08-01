import Link from "next/link";
import { CalendarDays, Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import {
  ActivityFeed,
  AlertPanel,
  ChartContainer,
  DashboardGrid,
  MapContainer,
  PriorityIncidentTable,
  QuickActionButton,
  SlaHealthCard,
  SummaryCard,
  TableCard,
} from "@/components/dashboard/dashboard-components";
import { incidentRows, recentActivity } from "@/lib/mock-data";
import type { DashboardConfig, UserProfile } from "@/types";

export function DashboardView({ viewer, config }: { viewer: UserProfile; config: DashboardConfig }) {
  const readOnly = viewer.role === "Executive Viewer";
  return (
    <div className="mx-auto max-w-[1680px]">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        actions={<><span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600"><CalendarDays className="size-4" aria-hidden="true" /> August 1, 2026</span>{readOnly ? <Link href="/dashboard?export=summary" className={buttonStyles({ variant: "secondary" })}><Download className="size-4" aria-hidden="true" /> Export summary</Link> : <Link href="/dashboard?new=incident" className={buttonStyles()}><Plus className="size-4" aria-hidden="true" /> New action</Link>}</>}
      />
      {readOnly ? <div className="mb-5"><StatusBadge tone="information">Read-only executive view</StatusBadge></div> : null}
      <AlertPanel alert={config.alert} />
      <DashboardGrid className="mt-5 sm:grid-cols-2 xl:grid-cols-4">{config.metrics.map((metric) => <SummaryCard key={metric.label} metric={metric} />)}</DashboardGrid>
      <section className="mt-6" aria-labelledby="quick-actions-heading"><div className="mb-3 flex items-center justify-between"><h2 id="quick-actions-heading" className="text-base font-semibold text-slate-950">Quick actions</h2><p className="text-xs text-slate-500">Based on your permissions</p></div><DashboardGrid className="sm:grid-cols-2 xl:grid-cols-3">{config.quickActions.map((action) => <QuickActionButton key={action.label} action={action} />)}</DashboardGrid></section>
      <DashboardGrid className="mt-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.7fr)]"><ChartContainer /><SlaHealthCard /></DashboardGrid>
      <div className="mt-6"><MapContainer /></div>
      <DashboardGrid className="mt-6 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,.75fr)]"><TableCard title="Priority incident queue" description="Active records that need operational attention" action={<Link href={viewer.role === "Barangay Official" ? "/incidents" : "/dashboard?module=incidents"} className="text-sm font-semibold text-brand-700 hover:underline">View incident register</Link>}><PriorityIncidentTable rows={incidentRows} /></TableCard><ActivityFeed activities={recentActivity} /></DashboardGrid>
    </div>
  );
}
