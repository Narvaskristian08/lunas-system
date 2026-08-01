"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CircleAlert,
  CloudCog,
  Construction,
  FileQuestion,
  RefreshCw,
  Router,
  ShieldX,
} from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type StateKind = "offline" | "server" | "access" | "unauthorized" | "notFound" | "maintenance";
const stateIcon = { offline: Router, server: CloudCog, access: ShieldX, unauthorized: Ban, notFound: FileQuestion, maintenance: Construction };
const stateTone = { offline: "warning", server: "critical", access: "critical", unauthorized: "critical", notFound: "information", maintenance: "information" } as const;

export function SystemState({
  kind,
  eyebrow,
  title,
  description,
  role,
  referenceId,
  primaryAction,
  secondaryAction,
  tertiaryAction,
  detail,
  fullPage = false,
}: {
  kind: StateKind;
  eyebrow?: string;
  title: string;
  description: string;
  role?: UserRole;
  referenceId?: string;
  primaryAction?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
  tertiaryAction?: { label: string; href: string };
  detail?: React.ReactNode;
  fullPage?: boolean;
}) {
  const Icon = stateIcon[kind];
  const renderAction = (action: NonNullable<typeof primaryAction>, primary: boolean) => {
    const className = buttonStyles({ variant: primary ? "primary" : "secondary", size: "lg" });
    if (action.href) return <Link href={action.href} className={className}>{primary && kind === "offline" ? <RefreshCw className="size-4" aria-hidden="true" /> : null}{action.label}</Link>;
    return <Button variant={primary ? "primary" : "secondary"} size="lg" onClick={action.onClick}>{primary && (kind === "offline" || kind === "server" || kind === "maintenance") ? <RefreshCw className="size-4" aria-hidden="true" /> : null}{action.label}</Button>;
  };
  return (
    <div className={cn("flex flex-col items-center justify-center px-5 text-center", fullPage ? "min-h-[calc(100vh-8rem)] py-16" : "min-h-[420px] py-12")}>
      <div className="relative">
        <span className="flex size-20 items-center justify-center rounded-3xl border border-slate-200 bg-white text-brand-700 shadow-sm"><Icon className="size-9" aria-hidden="true" /></span>
        <span className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-4 border-slate-50 bg-white"><CircleAlert className="size-4 text-amber-700" aria-hidden="true" /></span>
      </div>
      {eyebrow ? <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p> : null}
      <h1 className="mt-2 max-w-xl text-balance text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-xl text-balance text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {role ? <RoleBadge role={role} /> : null}
        {referenceId ? <StatusBadge tone={stateTone[kind]}>Reference {referenceId}</StatusBadge> : null}
      </div>
      {detail ? <div className="mt-5 max-w-xl rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-600">{detail}</div> : null}
      {(primaryAction || secondaryAction) ? <div className="mt-7 flex w-full max-w-lg flex-col-reverse justify-center gap-3 sm:flex-row">{secondaryAction ? renderAction(secondaryAction, false) : null}{primaryAction ? renderAction(primaryAction, true) : null}</div> : null}
      {tertiaryAction ? <Link href={tertiaryAction.href} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-brand-700 hover:bg-brand-50"><ArrowLeft className="size-4" aria-hidden="true" />{tertiaryAction.label}</Link> : null}
    </div>
  );
}

export function OfflineState({ onRetry, fullPage = false }: { onRetry?: () => void; fullPage?: boolean }) {
  return <SystemState kind="offline" eyebrow="Connection status" title="You’re offline" description="Reconnect to the internet, then retry. Any information you entered on this page is still here." primaryAction={{ label: "Try again", onClick: onRetry ?? (() => window.location.reload()) }} fullPage={fullPage} detail={<p>Showing the last available interface. Live incident and SLA data may be out of date.</p>} />;
}

export function ErrorState({ onRetry, referenceId, variant = "general", fullPage = false }: { onRetry?: () => void; referenceId?: string; variant?: "general" | "unavailable" | "timeout" | "data"; fullPage?: boolean }) {
  const copy = {
    general: ["We couldn’t complete that request", "LUNAS encountered a temporary problem. No sensitive technical details have been displayed."],
    unavailable: ["Service temporarily unavailable", "This LUNAS service cannot be reached right now. Try again in a few moments."],
    timeout: ["The request took too long", "The service did not respond in time. Your changes have not been submitted."],
    data: ["We couldn’t load this information", "The rest of LUNAS is still available. Retry this section when you’re ready."],
  }[variant];
  return <SystemState kind="server" eyebrow="System response" title={copy[0]} description={copy[1]} referenceId={referenceId} primaryAction={{ label: "Retry", onClick: onRetry ?? (() => window.location.reload()) }} secondaryAction={{ label: "Return to dashboard", href: "/dashboard" }} fullPage={fullPage} />;
}

export function AccessDeniedState({ role, fullPage = false }: { role: UserRole; fullPage?: boolean }) {
  return <SystemState kind="access" eyebrow="Permission required" title="Access denied" description="Your current role does not include permission to view this area. No restricted information has been shown." role={role} primaryAction={{ label: "Return to dashboard", href: "/dashboard" }} secondaryAction={{ label: "Go back", onClick: () => window.history.back() }} tertiaryAction={{ label: "Contact an administrator", href: "/help" }} fullPage={fullPage} />;
}
