"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, KeyRound, Link2Off } from "lucide-react";
import { AuthAlert, AuthCard, BackToLogin, SecurityNotice } from "@/components/auth/auth-ui";
import { PasswordField } from "@/components/forms/password-field";
import { PasswordStrength } from "@/components/forms/password-strength";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { accountService } from "@/lib/mock-api";
import { cn, passwordChecks } from "@/lib/utils";

type ResetTokenState = "checking" | "valid" | "invalid" | "expired" | "success";

export function ResetPasswordForm({
  token,
  initialTokenStatus = "valid",
}: {
  token: string;
  initialTokenStatus?: "valid" | "invalid" | "expired";
}) {
  const [tokenState, setTokenState] = useState<ResetTokenState>("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [requestError, setRequestError] = useState<"offline" | "server" | null>(null);
  const { online, checked } = useConnectivity();

  useEffect(() => {
    const timer = window.setTimeout(() => setTokenState(initialTokenStatus), 500);
    return () => window.clearTimeout(timer);
  }, [initialTokenStatus]);

  const checks = useMemo(() => passwordChecks(password), [password]);
  const meetsRequirements = Object.values(checks).every(Boolean);
  const matches = confirmation.length > 0 && confirmation === password;
  const passwordError = submitted && !meetsRequirements ? "Choose a stronger password that meets every requirement below." : undefined;
  const confirmationError = confirmation && confirmation !== password
    ? "The passwords do not match. Re-enter the confirmation."
    : submitted && !confirmation
      ? "Re-enter your new password to confirm it."
      : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setSubmitted(true);
    if (!meetsRequirements || !matches) return;
    setPending(true);
    setRequestError(null);
    try {
      await accountService.resetPassword(token, password);
      setTokenState("success");
      setPassword("");
      setConfirmation("");
    } catch (caught) {
      setRequestError(caught instanceof Error && caught.message === "OFFLINE" ? "offline" : "server");
    } finally {
      setPending(false);
    }
  }

  if (tokenState === "checking") {
    return (
      <AuthCard>
        <div role="status" aria-label="Checking password reset link" className="animate-pulse space-y-5">
          <span className="sr-only">Checking password reset link…</span>
          <div className="h-12 rounded-xl bg-slate-200" />
          <div className="h-12 rounded-xl bg-slate-200" />
          <div className="h-28 rounded-xl bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-200" />
        </div>
      </AuthCard>
    );
  }

  if (tokenState === "invalid" || tokenState === "expired") {
    const expired = tokenState === "expired";
    const Icon = expired ? Clock3 : Link2Off;
    return (
      <AuthCard className="text-center">
        <span className={cn("mx-auto flex size-14 items-center justify-center rounded-full", expired ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700")}>
          <Icon className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">{expired ? "Reset link expired" : "Reset link is invalid"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {expired
            ? "For your security, password reset links are available for a limited time. Request a fresh link to continue."
            : "This link cannot be verified. It may have already been used or copied incorrectly."}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/forgot-password" className={buttonStyles({ variant: "primary" })}>Request a new link</Link>
          <BackToLogin />
        </div>
      </AuthCard>
    );
  }

  if (tokenState === "success") {
    return (
      <AuthCard className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">Password reset complete</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" role="status">
          Your new password is ready. Sign in again to securely access the LUNAS command center.
        </p>
        <Link href="/login" className={buttonStyles({ size: "lg", className: "mt-6 w-full" })}>
          <KeyRound className="size-4.5" aria-hidden="true" />
          Return to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form onSubmit={submit} className="space-y-5" noValidate aria-busy={pending}>
        {checked && !online ? (
          <AuthAlert tone="warning" title="No internet connection" assertive>
            Reconnect before resetting your password. Your entries will remain in this form.
          </AuthAlert>
        ) : null}
        {requestError ? (
          <AuthAlert tone={requestError === "offline" ? "warning" : "error"} title={requestError === "offline" ? "Connection lost" : "Password not reset"} assertive>
            {requestError === "offline" ? "Reconnect and submit again. Your password entries have not been cleared." : "The password service is temporarily unavailable. Please try again shortly."}
          </AuthAlert>
        ) : null}

        <div>
          <PasswordField
            id="new-password"
            name="newPassword"
            label="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            disabled={pending}
            error={passwordError}
          />
          <PasswordStrength password={password} />
        </div>
        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          autoComplete="new-password"
          required
          disabled={pending}
          error={confirmationError}
        />

        <Button className="w-full" size="lg" type="submit" loading={pending} loadingLabel="Resetting password…" disabled={!meetsRequirements || !matches || (checked && !online)}>
          Reset password
        </Button>
        <BackToLogin />
      </form>

      <SecurityNotice>Use a unique password that you do not use for email, banking, or another government system.</SecurityNotice>
    </AuthCard>
  );
}
