"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PasswordField } from "@/components/forms/password-field";
import { PasswordStrength } from "@/components/forms/password-strength";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { profileService } from "@/lib/mock-api";
import { passwordChecks } from "@/lib/utils";

function ChangePasswordWorkspace() {
  const { notify } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [sessionsRevoked, setSessionsRevoked] = useState<boolean | null>(null);

  const checks = useMemo(() => passwordChecks(newPassword), [newPassword]);
  const strongEnough = Object.values(checks).every(Boolean);
  const errors = {
    current: !currentPassword ? "Enter your current password." : undefined,
    next: !newPassword
      ? "Enter a new password."
      : !strongEnough
        ? "Meet every password requirement shown below."
        : newPassword === currentPassword
          ? "Choose a password that is different from your current password."
          : undefined,
    confirm: !confirmPassword
      ? "Re-enter your new password."
      : confirmPassword !== newPassword
        ? "The confirmation does not match your new password."
        : undefined,
  };
  const valid = !errors.current && !errors.next && !errors.confirm;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ current: true, next: true, confirm: true });
    if (!valid || submitting) return;

    setSubmitting(true);
    setServerError(undefined);
    try {
      const result = await profileService.changePassword();
      setSessionsRevoked(result.data.sessionsRevoked);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify({ title: "Password changed", message: "Your account security settings were updated.", tone: "success" });
    } catch (error) {
      setServerError(error instanceof Error && error.message === "OFFLINE"
        ? "You’re offline. Reconnect before changing your password."
        : "We couldn’t change your password. Confirm your current password and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionsRevoked !== null) {
    return (
      <>
        <PageHeader
          title="Change password"
          eyebrow="Account security"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "My profile", href: "/profile" },
            { label: "Change password" },
          ]}
        />
        <Card className="mx-auto max-w-2xl p-6 text-center sm:p-8">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Password changed successfully</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Your new password is active. {sessionsRevoked
              ? "Existing LUNAS sessions were revoked under the current security policy. Sign in again using your new password."
              : "Your current signed-in session remains active under the current security policy."}
          </p>
          <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Link href="/profile" className={buttonStyles({ variant: "secondary", size: "lg" })}>Return to profile</Link>
            {sessionsRevoked ? (
              <Link href="/login" className={buttonStyles({ variant: "primary", size: "lg" })}>
                <LogIn className="size-4" aria-hidden="true" /> Sign in again
              </Link>
            ) : null}
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Change password"
        eyebrow="Account security"
        description="Use a unique password that you do not use for another government or personal account."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My profile", href: "/profile" },
          { label: "Change password" },
        ]}
        actions={
          <Link href="/profile" className={buttonStyles({ variant: "secondary" })}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to profile
          </Link>
        }
      />

      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader title="Set a new password" description="All three fields are required." />
          <form onSubmit={submit} noValidate className="space-y-5 p-5 sm:p-6">
            <PasswordField
              label="Current password"
              required
              value={currentPassword}
              onChange={(event) => { setCurrentPassword(event.target.value); setServerError(undefined); }}
              onBlur={() => setTouched((state) => ({ ...state, current: true }))}
              error={touched.current ? errors.current : undefined}
              autoComplete="current-password"
            />

            <div className="border-t border-slate-200 pt-5">
              <PasswordField
                label="New password"
                required
                value={newPassword}
                onChange={(event) => { setNewPassword(event.target.value); setServerError(undefined); }}
                onBlur={() => setTouched((state) => ({ ...state, next: true }))}
                error={touched.next ? errors.next : undefined}
                autoComplete="new-password"
              />
              <PasswordStrength password={newPassword} />
            </div>

            <PasswordField
              label="Confirm new password"
              required
              value={confirmPassword}
              onChange={(event) => { setConfirmPassword(event.target.value); setServerError(undefined); }}
              onBlur={() => setTouched((state) => ({ ...state, confirm: true }))}
              error={touched.confirm ? errors.confirm : undefined}
              autoComplete="new-password"
            />

            {serverError ? (
              <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div><p className="font-semibold">Password was not changed</p><p className="mt-1">{serverError}</p></div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Link href="/profile" className={buttonStyles({ variant: "secondary" })}>Cancel</Link>
              <Button type="submit" disabled={!valid} loading={submitting} loadingLabel="Changing password…">
                <KeyRound className="size-4" aria-hidden="true" /> Change password
              </Button>
            </div>
          </form>
        </Card>

        <Card className="self-start p-5 lg:sticky lg:top-28">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">Security reminder</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                LUNAS staff will never ask for your password. Passwords are sent only to the account service and are never stored in browser persistence.
              </p>
            </div>
          </div>
          <Link href="/help" className="mt-4 inline-flex min-h-10 items-center rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">
            Report an account security concern
          </Link>
        </Card>
      </div>
    </>
  );
}

export function ChangePasswordForm() {
  return (
    <PermissionGate permission="profile.manage" mode="denied">
      <ChangePasswordWorkspace />
    </PermissionGate>
  );
}
