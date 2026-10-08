"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Clock3, FileWarning, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { clearExpiredSessionAction } from "@/app/actions/auth";
import { AuthCard, SecurityNotice } from "@/components/auth/auth-ui";
import { buttonStyles } from "@/components/ui/button";

const reasonCopy = {
  expired: "Your sign-in timed out after the allowed session period.",
  invalid: "LUNAS could not verify this browser session, so it was closed for your protection.",
  revoked: "This session was ended because your account or access permissions changed.",
  security: "LUNAS signed you out after a security-related session change.",
  inactivity: "You were signed out after a long period of inactivity.",
} as const;

export function SessionExpiredCard({ returnTo, reason }: { returnTo: string; reason?: string }) {
  const [cleared, setCleared] = useState(false);
  const requested = useRef(false);
  const explanation = reason && reason in reasonCopy
    ? reasonCopy[reason as keyof typeof reasonCopy]
    : "Your secure session is no longer active. Sign in again to continue.";

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    void clearExpiredSessionAction().finally(() => setCleared(true));
  }, []);

  return (
    <AuthCard className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
        <Clock3 className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">Your Session Has Ended</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{explanation}</p>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
        <FileWarning className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-800">About Unsaved Work</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-600">Changes that were not submitted may have been lost. After signing in, verify the affected record before entering the information again.</p>
        </div>
      </div>

      <div className="mt-6" aria-live="polite">
        {!cleared ? (
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Securing this browser session…
          </p>
        ) : (
          <p className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-emerald-700" role="status">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Previous session data cleared
          </p>
        )}
        {cleared ? (
          <Link
            href={{ pathname: "/login", query: returnTo !== "/dashboard" ? { next: returnTo } : undefined }}
            className={buttonStyles({ size: "lg", className: "w-full" })}
          >
            <LogIn className="size-4.5" aria-hidden="true" />
            Sign in Again
          </Link>
        ) : (
          <span className={buttonStyles({ size: "lg", className: "w-full cursor-wait opacity-55" })} aria-hidden="true">
            <LoaderCircle className="size-4.5 animate-spin" />
            Preparing secure sign-in…
          </span>
        )}
        {returnTo !== "/dashboard" ? (
          <p className="mt-2 text-xs text-slate-500">After sign-in, LUNAS will return you to the page you requested.</p>
        ) : null}
      </div>

      <Link className="mt-4 inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-brand-700 hover:underline" href="/login">
        Return to Login Without Continuing
      </Link>
      <SecurityNotice>Your account remains protected. LUNAS never stores your password in this browser.</SecurityNotice>
    </AuthCard>
  );
}
