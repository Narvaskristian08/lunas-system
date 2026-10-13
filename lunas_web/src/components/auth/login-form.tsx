"use client";

import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { LockKeyhole, WifiOff } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import type { LoginActionState } from "@/app/actions/auth";
import { AuthAlert, AuthCard, SecurityNotice } from "@/components/auth/auth-ui";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { FormField } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { Button } from "@/components/ui/button";
import { useConnectivity } from "@/components/providers/connectivity-provider";

const outcomeActions = {
  UNVERIFIED: { href: "/verify-account", label: "Verify Account" },
  SUSPENDED: { href: "mailto:lunas-support@dagupan.gov.ph", label: "Contact Support" },
  DEACTIVATED: { href: "mailto:lunas-support@dagupan.gov.ph", label: "Contact Support" },
  RATE_LIMITED: { href: "/forgot-password", label: "Reset Password" },
  MAINTENANCE: { href: "/maintenance", label: "View System Status" },
} as const;

const initialLoginState: LoginActionState = { status: "idle", attempt: 0 };

export function LoginForm({
  returnTo = "/dashboard",
  registrationComplete = false,
  turnstileSiteKey,
  captchaDisabled = false,
}: {
  returnTo?: string;
  registrationComplete?: boolean;
  turnstileSiteKey: string;
  captchaDisabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(loginAction, initialLoginState);
  const { online, checked } = useConnectivity();
  const alertRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const onCaptchaVerificationChange = useCallback((verified: boolean) => setCaptchaVerified(verified), []);

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

  return (
    <AuthCard>
      {registrationComplete ? (
        <AuthAlert tone="success" title="Account created successfully" className="mb-5">
          Your email is verified. Sign in with the password you created to continue.
        </AuthAlert>
      ) : null}
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
          label="Authorized Email Address"
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

        {!captchaDisabled ? (
          <>
            <TurnstileWidget
              siteKey={turnstileSiteKey}
              resetKey={String(state.attempt ?? 0)}
              onVerificationChange={onCaptchaVerificationChange}
            />
            {state.fieldErrors?.captcha ? <p className="text-sm font-medium text-red-700">{state.fieldErrors.captcha}</p> : null}
          </>
        ) : null}

        <Button type="submit" size="lg" className="w-full" loading={pending} loadingLabel="Signing in…" disabled={(checked && !online) || (!captchaDisabled && !captchaVerified)}>
          <LockKeyhole className="size-4.5" aria-hidden="true" />
          Sign in to Command Center
        </Button>

        <p className="text-center text-sm text-slate-600">
          Need a citizen account?{" "}
          <Link className="font-semibold text-brand-700 hover:text-brand-900 hover:underline" href="/register">
            Create one
          </Link>
        </p>
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
