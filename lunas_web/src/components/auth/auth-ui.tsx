import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const alertStyles = {
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-blue-200 bg-blue-50 text-blue-950",
} as const;

const alertIcons = {
  error: ShieldAlert,
  warning: TriangleAlert,
  success: CheckCircle2,
  info: Info,
};

export function AuthAlert({
  tone,
  title,
  children,
  className,
  assertive = false,
  tabIndex,
}: {
  tone: keyof typeof alertStyles;
  title: string;
  children?: React.ReactNode;
  className?: string;
  assertive?: boolean;
  tabIndex?: number;
}) {
  const Icon = alertIcons[tone];
  return (
    <div
      className={cn("flex gap-3 rounded-xl border p-3.5 text-sm", alertStyles[tone], className)}
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      tabIndex={tabIndex}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {children ? <div className="mt-0.5 leading-5 opacity-90">{children}</div> : null}
      </div>
    </div>
  );
}

export function BackToLogin({ label = "Back to sign in" }: { label?: string }) {
  return (
    <Link
      href="/login"
      className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function AuthCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-7", className)}>
      {children}
    </section>
  );
}

export function SecurityNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 text-xs leading-5 text-slate-500">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
