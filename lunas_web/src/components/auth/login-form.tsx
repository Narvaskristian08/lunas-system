"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Check, KeyRound, LockKeyhole, UsersRound, WifiOff } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import type { LoginActionState } from "@/app/actions/auth";
import { AuthAlert, AuthCard, SecurityNotice } from "@/components/auth/auth-ui";
import { FormField } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { Button } from "@/components/ui/button";
import { useConnectivity } from "@/components/providers/connectivity-provider";

const outcomeActions = {
  UNVERIFIED: { href: "/verify-account", label: "Verify account" },
  SUSPENDED: { href: "mailto:lunas-support@dagupan.gov.ph", label: "Contact support" },
  DEACTIVATED: { href: "mailto:lunas-support@dagupan.gov.ph", label: "Contact support" },
  RATE_LIMITED: { href: "/forgot-password", label: "Reset password" },
  MAINTENANCE: { href: "/maintenance", label: "View system status" },
} as const;

const initialLoginState: LoginActionState = { status: "idle" };

const demoAccounts = [
  { role: "Barangay Official", name: "Maria Santos", email: "maria.santos@pantal.gov.ph", focus: "Community report validation" },
  { role: "City Engineering Office", name: "Rafael Cruz", email: "rafael.cruz@dagupan.gov.ph", focus: "Assignments and SLA response" },
  { role: "Utility Provider", name: "Ana Reyes", email: "ana.reyes@dagupanwater.gov.ph", focus: "Utility work queue" },
  { role: "System Administrator", name: "Carlo Mendoza", email: "carlo.mendoza@lunas.gov.ph", focus: "Users and platform health" },
  { role: "Maintenance Coordinator", name: "Miguel Torres", email: "miguel.torres@dagupan.gov.ph", focus: "Crew and repair operations" },
  { role: "Executive Viewer", name: "Elena Garcia", email: "elena.garcia@dagupan.gov.ph", focus: "Read-only city performance" },
] as const;

const demoPassword = "LunasDemo!2026";

export function LoginForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);
  const { online, checked } = useConnectivity();
  const alertRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const remembered = window.localStorage.getItem("lunas_remembered_email");
    if (remembered && emailRef.current && !emailRef.current.value) {
      emailRef.current.value = remembered;
      if (rememberRef.current) rememberRef.current.checked = true;
    }
  }, []);

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  const outcomeAction = state.code && state.code in outcomeActions
    ? outcomeActions[state.code as keyof typeof outcomeActions]
    : null;

  const loadDemoAccount = (email: string) => {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current) passwordRef.current.value = demoPassword;
    submitRef.current?.focus();
  };

  return (
    <AuthCard>
      <form
        action={formAction}
        className="space-y-5"
        aria-busy={pending}
        noValidate
        onSubmit={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }
          const email = emailRef.current?.value.trim() ?? "";
          if (rememberRef.current?.checked && email) window.localStorage.setItem("lunas_remembered_email", email);
          else window.localStorage.removeItem("lunas_remembered_email");
        }}
      >
        <input type="hidden" name="next" value={returnTo} />

        {checked && !online ? (
          <AuthAlert tone="warning" title="No internet connection" assertive>
            Reconnect before signing in. Your email will remain in this form.
          </AuthAlert>
        ) : null}

        {state.status === "error" ? (
          <div ref={alertRef} tabIndex={-1}>
            <AuthAlert tone={state.code === "MAINTENANCE" || state.code === "RATE_LIMITED" ? "warning" : "error"} title="We couldn’t sign you in" assertive>
              <p>{state.message}</p>
              {outcomeAction ? (
                <Link className="mt-1 inline-block font-semibold underline underline-offset-2" href={outcomeAction.href}>
                  {outcomeAction.label}
                </Link>
              ) : null}
            </AuthAlert>
          </div>
        ) : null}

        <FormField
          ref={emailRef}
          id="email"
          label="Authorized email address"
          required
          error={state.fieldErrors?.email}
          helperText="Use the email assigned to your LUNAS account."
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.email}
          disabled={pending}
          placeholder="name@agency.gov.ph"
        />

        <PasswordField
          ref={passwordRef}
          id="password"
          name="password"
          label="Password"
          aria-label="Password"
          autoComplete="current-password"
          required
          disabled={pending}
          error={state.fieldErrors?.password}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input ref={rememberRef} type="checkbox" className="size-4 rounded border-slate-300 accent-brand-700" />
            Remember my email
          </label>
          <Link className="rounded text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline" href="/forgot-password">
            Forgot password?
          </Link>
        </div>

        <Button ref={submitRef} type="submit" size="lg" className="w-full" loading={pending} loadingLabel="Signing in…" disabled={checked && !online}>
          <LockKeyhole className="size-4.5" aria-hidden="true" />
          Sign in to command center
        </Button>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="mock-accounts-heading">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-800"><UsersRound className="size-4.5" aria-hidden="true" /></span>
            <div>
              <h2 id="mock-accounts-heading" className="text-sm font-semibold text-slate-900">Role mockup accounts</h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">Choose an account to load its credentials, then sign in to inspect its custom dashboard and navigation.</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => loadDemoAccount(account.email)}
                disabled={pending}
                className="group min-h-20 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-sky-400/50 disabled:opacity-55"
                aria-label={`Use ${account.role} mockup account`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold leading-4 text-brand-800">{account.role}</span>
                  <Check className="size-4 shrink-0 text-brand-700 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
                </span>
                <span className="mt-1 block text-xs font-medium text-slate-800">{account.name}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{account.focus}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500"><KeyRound className="size-3.5" aria-hidden="true" /> All mockups use password <span className="font-mono font-semibold text-slate-700">{demoPassword}</span></p>
        </section>
      </form>

      <SecurityNotice>
        This system is for authorized government and partner-agency personnel only. Activity is logged for security and accountability.
      </SecurityNotice>
      {checked && !online ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-800" role="status">
          <WifiOff className="size-4" aria-hidden="true" /> Offline — waiting for your connection to return
        </p>
      ) : null}
    </AuthCard>
  );
}
