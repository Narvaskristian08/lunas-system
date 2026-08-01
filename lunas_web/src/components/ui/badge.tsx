import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleAlert,
  Info,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Severity, UserRole } from "@/types";

const tones: Record<Severity, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  information: "border-blue-200 bg-blue-50 text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-slate-200 bg-slate-100 text-slate-700",
};

const toneIcons = {
  critical: CircleAlert,
  warning: AlertTriangle,
  information: Info,
  success: CheckCircle2,
  neutral: Circle,
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  icon = true,
}: {
  tone?: Severity;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}) {
  const Icon = toneIcons[tone];
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/** Compact semantic label for contexts where an icon would be redundant. */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Severity;
  children: React.ReactNode;
  className?: string;
}) {
  return <StatusBadge tone={tone} className={className} icon={false}>{children}</StatusBadge>;
}

export function RoleBadge({ role, compact = false }: { role: UserRole; compact?: boolean }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-brand-800">
      <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
      <span className={cn("truncate", compact && "sr-only")}>{role}</span>
    </span>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-[11px] font-bold leading-5 text-white"
      aria-label={`${count} unread notifications`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
