import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  HardHat,
  MapPin,
  Navigation,
  ShieldAlert,
  Timer,
  UserRoundCog,
  Users,
  Wrench,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { PermissionGate } from "@/components/auth/permission-gate";
import { cn } from "@/lib/utils";
import type { DashboardConfig, DashboardMetric, Permission, Severity } from "@/types";

const metricIcons = {
  reports: FileWarning,
  incident: ShieldAlert,
  workOrder: HardHat,
  sla: Timer,
  users: Users,
  verified: FileCheck2,
};

const toneStyles: Record<Severity, { accent: string; well: string; text: string }> = {
  critical: { accent: "border-l-red-600", well: "bg-red-50 text-red-700", text: "text-red-700" },
  warning: { accent: "border-l-amber-500", well: "bg-amber-50 text-amber-800", text: "text-amber-800" },
  information: { accent: "border-l-blue-600", well: "bg-blue-50 text-blue-700", text: "text-blue-700" },
  success: { accent: "border-l-emerald-600", well: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" },
  neutral: { accent: "border-l-slate-400", well: "bg-slate-100 text-slate-700", text: "text-slate-600" },
};

export function DashboardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-5", className)}>{children}</div>;
}

export function SummaryCard({ metric }: { metric: DashboardMetric }) {
  const Icon = metricIcons[metric.icon];
  const tone = toneStyles[metric.tone];
  return (
    <Card className={cn("min-w-0 border-l-4 p-5", tone.accent)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-600">{metric.label}</p>
          <p className="mono mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-950">{metric.value}</p>
        </div>
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone.well)}><Icon className="size-5" aria-hidden="true" /></span>
      </div>
      {metric.change ? (
        <p className={cn("mt-4 flex items-center gap-1.5 text-xs font-semibold", tone.text)}>
          {metric.trend === "up" ? <ArrowUpRight className="size-3.5" aria-hidden="true" /> : metric.trend === "down" ? <ArrowDownRight className="size-3.5" aria-hidden="true" /> : <Activity className="size-3.5" aria-hidden="true" />}
          {metric.change}
        </p>
      ) : null}
    </Card>
  );
}

export function AlertPanel({ alert }: { alert: DashboardConfig["alert"] }) {
  const style = {
    critical: "border-red-200 bg-red-50 text-red-950",
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    information: "border-blue-200 bg-blue-50 text-blue-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    neutral: "border-slate-200 bg-slate-50 text-slate-900",
  }[alert.tone];
  return (
    <section className={cn("flex flex-col gap-4 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center", style)} aria-label="Priority alert">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/80"><BellRing className="size-5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{alert.title}</h2><StatusBadge tone={alert.tone}>Action recommended</StatusBadge></div><p className="mt-1 text-sm opacity-80">{alert.message}</p></div>
      <button type="button" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-current/20 bg-white/80 px-3.5 text-sm font-semibold hover:bg-white">{alert.actionLabel}<ArrowRight className="size-4" aria-hidden="true" /></button>
    </section>
  );
}

const actionIcons = { report: FileWarning, assign: UserRoundCog, verify: ClipboardCheck, users: Users, analytics: ChartNoAxesCombined, workOrder: Wrench };

export function QuickActionButton({ action }: { action: DashboardConfig["quickActions"][number] }) {
  const Icon = actionIcons[action.icon];
  const content = (
    <Link href={action.href} className="group flex min-h-[90px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-white"><Icon className="size-5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold text-slate-900">{action.label}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{action.description}</span></span>
      <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-700" aria-hidden="true" />
    </Link>
  );
  return action.permission ? <PermissionGate permission={action.permission as Permission}>{content}</PermissionGate> : content;
}

export function TableCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <Card className="min-w-0 overflow-hidden"><CardHeader title={title} description={description} action={action} />{children}</Card>;
}

export function ChartContainer() {
  const bars = [42, 56, 49, 72, 65, 84, 76];
  return (
    <Card className="min-w-0 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-950">Incident throughput</h2><p className="mt-0.5 text-sm text-slate-500">Reports opened and resolved · Last 7 days</p></div><StatusBadge tone="success">Resolution +8.2%</StatusBadge></div>
      <div className="mt-6 grid grid-cols-[auto_1fr] gap-3">
        <div className="flex h-48 flex-col justify-between pb-6 text-[10px] text-slate-400"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div>
        <div className="relative h-48 border-b border-l border-slate-200">
          <div className="absolute inset-0 flex flex-col justify-between pb-6" aria-hidden="true">{[0,1,2,3].map((line) => <span key={line} className="block border-t border-dashed border-slate-200" />)}</div>
          <div className="absolute inset-0 flex items-end justify-around gap-2 px-2 pb-6" role="img" aria-label="Incident volume rose from 42 to a peak of 84 and ended at 76 over seven days">
            {bars.map((value, index) => <div key={value + index} className="group flex h-full flex-1 items-end"><span className="w-full rounded-t-md bg-brand-200 transition group-hover:bg-brand-400" style={{ height: `${value}%` }}><span className="sr-only">Day {index + 1}: {value} incidents</span></span></div>)}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex h-5 justify-around px-2 text-[10px] text-slate-500">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <span className="flex-1 text-center" key={day}>{day}</span>)}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-slate-600"><span className="inline-flex items-center gap-2"><span className="size-2.5 rounded-sm bg-brand-300" /> Opened: 444</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-700" aria-hidden="true" /> Resolved: 407</span></div>
    </Card>
  );
}

export function SlaHealthCard() {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-950">SLA health</h2><p className="mt-0.5 text-sm text-slate-500">City-wide active deadlines</p></div><Timer className="size-5 text-brand-700" aria-hidden="true" /></div>
      <div className="mt-5 flex items-center gap-5">
        <div className="relative flex size-28 shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#1b6d24 0 91.4%, #e7ecf1 91.4% 100%)" }} role="img" aria-label="91.4 percent SLA compliance"><div className="flex size-20 flex-col items-center justify-center rounded-full bg-white"><span className="mono text-xl font-bold text-slate-950">91.4%</span><span className="text-[10px] text-slate-500">compliant</span></div></div>
        <dl className="min-w-0 flex-1 space-y-3 text-sm"><div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-slate-600"><span className="size-2 rounded-full bg-emerald-600" /> On target</dt><dd className="mono font-semibold">103</dd></div><div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-slate-600"><span className="size-2 rounded-full bg-amber-500" /> At risk</dt><dd className="mono font-semibold">15</dd></div><div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-2 text-slate-600"><span className="size-2 rounded-full bg-red-600" /> Overdue</dt><dd className="mono font-semibold">8</dd></div></dl>
      </div>
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950"><strong>Next deadline:</strong> <span className="mono">INC-2026-0112 · 00:48:17</span></div>
    </Card>
  );
}

export function MapContainer() {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader title="Live incident coverage" description="Validated active incidents across Dagupan City" action={<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="size-2 rounded-full bg-emerald-600" /> Live</span>} />
      <div className="grid min-h-[330px] lg:grid-cols-[1fr_250px]">
        <div className="relative overflow-hidden bg-[#e9f0e4]" role="img" aria-label="Operational map showing incident clusters across Dagupan City">
          <svg viewBox="0 0 760 330" className="h-full min-h-[300px] w-full" aria-hidden="true">
            <rect width="760" height="330" fill="#eaf1e8" />
            <path d="M0 270C140 245 184 287 320 258S540 237 760 274V330H0Z" fill="#bedbea" />
            <path d="M-10 92C130 122 225 55 345 92s217 31 425-12" stroke="#fff" strokeWidth="17" fill="none" />
            <path d="M78 -10c25 84 36 140 17 340M220 -10c-5 122 47 192 20 340M520 -10c-21 101 32 204 12 340" stroke="#fff" strokeWidth="11" fill="none" />
            <path d="M-10 196c117-23 203 28 318 3 129-28 247-70 462-27" stroke="#fff" strokeWidth="9" fill="none" />
            <path d="M0 92C130 122 225 55 345 92s217 31 415-12M78 0c25 84 36 140 17 330M220 0c-5 122 47 192 20 330M520 0c-21 101 32 204 12 330" stroke="#c9d2cc" strokeWidth="1.5" fill="none" />
            {[[155,95,"#ba1a1a"],[287,182,"#f59e0b"],[495,106,"#004d99"],[575,220,"#ba1a1a"],[396,242,"#1b6d24"],[86,210,"#f59e0b"]].map(([x,y,color], index) => <g key={index} transform={`translate(${x} ${y})`}><circle r="17" fill="white" opacity=".95" /><circle r="11" fill={String(color)} /><text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="700" fill="white">{index + 1}</text></g>)}
          </svg>
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 text-[10px] font-semibold text-slate-600 shadow-sm"><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-700" /> Critical</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> At risk</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-brand-700" /> Active</span></div>
        </div>
        <div className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Highest activity</p><ul className="mt-3 space-y-2">{[["Barangay Pantal","18","critical"],["Bonuan Gueset","14","warning"],["Lucao District","11","information"],["Downtown East","9","neutral"]].map(([name,count,tone]) => <li key={name} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2.5"><MapPin className="size-4 text-slate-400" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{name}</span><StatusBadge tone={tone as Severity} icon={false}>{count}</StatusBadge></li>)}</ul><button type="button" className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-4 w-full" })}><Navigation className="size-4" aria-hidden="true" /> Open city map</button></div>
      </div>
    </Card>
  );
}

export function ActivityFeed({ activities }: { activities: Array<{ id: string; title: string; detail: string; time: string; tone: Severity }> }) {
  return (
    <Card className="overflow-hidden"><CardHeader title="Recent activity" description="Latest workflow changes" action={<Link href="/notifications" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>} /><ol className="divide-y divide-slate-100">{activities.map((item) => <li key={item.id} className="flex gap-3 px-5 py-4"><span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full ring-4", item.tone === "critical" ? "bg-red-600 ring-red-50" : item.tone === "warning" ? "bg-amber-500 ring-amber-50" : item.tone === "success" ? "bg-emerald-600 ring-emerald-50" : "bg-brand-600 ring-brand-50")}><span className="sr-only">{item.tone}</span></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{item.detail}</p></div><time className="shrink-0 text-xs text-slate-500">{item.time}</time></li>)}</ol></Card>
  );
}

export function PriorityIncidentTable({ rows }: { rows: Array<{ id: string; type: string; location: string; assigned: string; status: string; sla: string; severity: Severity }> }) {
  const statusTone = (row: (typeof rows)[number]): Severity => row.status === "For verification" ? "information" : row.status === "In progress" ? "warning" : row.status === "Awaiting assignment" ? "critical" : "neutral";
  return <DataTable caption="Priority active incidents" columns={[{ key: "incident", label: "Incident" },{ key: "location", label: "Location" },{ key: "assigned", label: "Assigned to" },{ key: "status", label: "Status" },{ key: "sla", label: "SLA" }]} rows={rows.map((row) => ({ id: row.id, cells: { incident: <div><p className="mono font-semibold text-brand-800">{row.id}</p><p className="mt-0.5 text-xs text-slate-500">{row.type}</p></div>, location: row.location, assigned: row.assigned, status: <StatusBadge tone={statusTone(row)}>{row.status}</StatusBadge>, sla: <span className={cn("mono font-semibold", row.severity === "critical" ? "text-red-700" : row.severity === "warning" ? "text-amber-800" : "text-slate-700")}>{row.sla}</span> } }))} />;
}
