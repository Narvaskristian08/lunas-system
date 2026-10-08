"use client";

import Link from "next/link";
import { Clock3, Eye, ServerCog, ShieldCheck } from "lucide-react";
import { SystemState } from "@/components/states/system-state";
import { LunasBrand } from "@/components/ui/brand";

export type MaintenanceMode = "full" | "service" | "read-only";

const modeCopy = {
  full: {
    eyebrow: "Scheduled system maintenance",
    title: "LUNAS is temporarily unavailable",
    description: "The command center is undergoing planned maintenance. Operational records and submissions are unavailable until service is restored.",
    status: "Maintenance in progress",
    scope: "Full LUNAS command center",
  },
  service: {
    eyebrow: "Service maintenance",
    title: "One LUNAS service is temporarily unavailable",
    description: "Most of the command center remains available, but the affected service may not load or accept updates during maintenance.",
    status: "Service temporarily unavailable",
    scope: "A specific supporting service",
  },
  "read-only": {
    eyebrow: "Read-only maintenance",
    title: "LUNAS is available in read-only mode",
    description: "You can review available information, but edits and submissions are paused while maintenance is completed.",
    status: "Read-only operation",
    scope: "Updates and submissions",
  },
} as const;

export function MaintenanceState({
  mode,
  message,
  service,
  restorationTime,
  loginAvailable,
}: {
  mode: MaintenanceMode;
  message?: string;
  service?: string;
  restorationTime?: string;
  loginAvailable: boolean;
}) {
  const copy = modeCopy[mode];
  const scope = mode === "service" && service ? service : copy.scope;
  const primaryAction = mode === "full"
    ? { label: "Refresh Status", onClick: () => window.location.reload() }
    : { label: "Return to Dashboard", href: "/dashboard" };
  const secondaryAction = mode === "full"
    ? (loginAvailable ? { label: "Continue to Sign in", href: "/login" } : undefined)
    : { label: "Refresh Status", onClick: () => window.location.reload() };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <LunasBrand href={loginAvailable ? "/login" : "/maintenance"} />
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950" role="status">
            <ServerCog className="size-3.5" aria-hidden="true" /> {copy.status}
          </span>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 sm:px-6">
        <SystemState
          kind="maintenance"
          eyebrow={copy.eyebrow}
          title={copy.title}
          description={message || copy.description}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
          tertiaryAction={{ label: "Contact Support", href: loginAvailable ? "/login?next=%2Fhelp" : "/maintenance#support" }}
          detail={
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="flex items-center gap-1.5 font-semibold text-slate-800"><ServerCog className="size-4 text-brand-700" aria-hidden="true" /> Affected area</dt>
                <dd className="mt-1 text-slate-600">{scope}</dd>
              </div>
              {restorationTime ? (
                <div>
                  <dt className="flex items-center gap-1.5 font-semibold text-slate-800"><Clock3 className="size-4 text-brand-700" aria-hidden="true" /> Estimated restoration</dt>
                  <dd className="mt-1 text-slate-600">{restorationTime}</dd>
                </div>
              ) : (
                <div>
                  <dt className="flex items-center gap-1.5 font-semibold text-slate-800"><Clock3 className="size-4 text-brand-700" aria-hidden="true" /> Restoration update</dt>
                  <dd className="mt-1 text-slate-600">No estimate has been published.</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 font-semibold text-slate-800">
                  {mode === "read-only" ? <Eye className="size-4 text-brand-700" aria-hidden="true" /> : <ShieldCheck className="size-4 text-brand-700" aria-hidden="true" />}
                  What to do
                </dt>
                <dd className="mt-1 text-slate-600">
                  {mode === "read-only"
                    ? "Keep any unsubmitted changes outside the form and retry after write access is restored."
                    : "Keep this page open or return later. Refreshing the status will not bypass maintenance controls."}
                </dd>
              </div>
            </dl>
          }
          fullPage
        />
      </main>

      <footer id="support" className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs leading-5 text-slate-500 sm:px-6">
        <p>Need operational assistance? Contact your authorized LUNAS administrator through your agency’s approved support channel.</p>
        <p className="mt-1">System status messages are supplied by LUNAS operations. Restoration times appear only when formally published.</p>
        {loginAvailable ? <Link href="/privacy" className="mt-2 inline-flex min-h-9 items-center font-semibold text-brand-700 hover:underline">Privacy Policy</Link> : null}
      </footer>
    </div>
  );
}
