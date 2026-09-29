import type { ReactNode } from "react";
import { FileCheck2, FileWarning, HardHat, ShieldAlert, Timer, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardMetric, Severity } from "@/types";

const metricIcons = {
  reports: FileWarning,
  incident: ShieldAlert,
  workOrder: HardHat,
  sla: Timer,
  users: Users,
  verified: FileCheck2,
};

const toneStyles: Record<Severity, { accent: string; well: string }> = {
  critical: { accent: "border-l-red-600", well: "bg-red-50 text-red-700" },
  warning: { accent: "border-l-amber-500", well: "bg-amber-50 text-amber-800" },
  information: { accent: "border-l-blue-600", well: "bg-blue-50 text-blue-700" },
  success: { accent: "border-l-emerald-600", well: "bg-emerald-50 text-emerald-700" },
  neutral: { accent: "border-l-slate-400", well: "bg-slate-100 text-slate-700" },
};

export function DashboardGrid({ children, className }: { children: ReactNode; className?: string }) {
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
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tone.well)}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </Card>
  );
}
