"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, KeyRound, LogIn } from "lucide-react";
import { changePasswordAction } from "@/app/actions/auth";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PasswordField } from "@/components/forms/password-field";
import { PasswordStrength } from "@/components/forms/password-strength";
import { useToast } from "@/components/providers/toast-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { passwordChecks } from "@/lib/utils";

function ChangePasswordWorkspace({ onClose, onBusyChange }: { onClose: () => void; onBusyChange: (busy: boolean) => void }) {
  const { notify } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({ current: false, next: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [sessionsRevoked, setSessionsRevoked] = useState<boolean | null>(null);

  useEffect(() => { onBusyChange(submitting); }, [submitting, onBusyChange]);

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
      const result = await changePasswordAction({ currentPassword, newPassword });
      if (!result.ok) {
        setServerError(result.message ?? "We couldn’t change your password. Confirm your current password and try again.");
        return;
      }
      setSessionsRevoked(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify({ title: "Password Changed", message: "Your account security settings were updated.", tone: "success" });
    } catch {
      setServerError("We couldn’t change your password. Confirm your current password and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionsRevoked !== null) {
    return (
      <>
                <div className="py-4 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">Password Changed Successfully</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
            Your new password is active. {sessionsRevoked
              ? "Existing LUNAS sessions were revoked under the current security policy. Sign in again using your new password."
              : "Your current signed-in session remains active under the current security policy."}
          </p>
          <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={onClose}><span className="font-semibold">Done</span></Button>
            {sessionsRevoked ? (
              <Link href="/login" className={buttonStyles({ variant: "primary", size: "lg" })}>
                <LogIn className="size-4" aria-hidden="true" /> Sign In Again
              </Link>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="mb-5 text-sm leading-5 text-slate-600">Use a unique password that you do not use for another account. All three fields are required.</p>
          <form onSubmit={submit} noValidate className="space-y-4">
            <PasswordField
              label="Current Password"
              required
              value={currentPassword}
              onChange={(event) => { setCurrentPassword(event.target.value); setServerError(undefined); }}
              onBlur={() => setTouched((state) => ({ ...state, current: true }))}
              error={touched.current ? errors.current : undefined}
              autoComplete="current-password"
            />

            <div className="border-t border-slate-200 pt-5">
              <PasswordField
                label="New Password"
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
              label="Confirm New Password"
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
                <div><p className="font-semibold">Password Was Not Changed</p><p className="mt-1">{serverError}</p></div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}><span className="font-semibold">Cancel</span></Button>
              <Button type="submit" disabled={!valid} loading={submitting} loadingLabel="Changing Password…">
                <KeyRound className="size-4" aria-hidden="true" /> Change Password
              </Button>
            </div>
          </form>

    </>
  );
}

export function ChangePasswordForm({ onClose, onBusyChange }: { onClose: () => void; onBusyChange: (busy: boolean) => void }) {
  return (
    <PermissionGate permission="profile.manage" mode="denied">
      <ChangePasswordWorkspace onClose={onClose} onBusyChange={onBusyChange} />
    </PermissionGate>
  );
}
