"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { requestRecoveryEmailAction, verifyRecoveryEmailAction } from "@/app/actions/auth";
import { AuthAlert, SecurityNotice } from "@/components/auth/auth-ui";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { useViewer } from "@/components/providers/viewer-provider";
import { isValidEmail, safeReturnPath } from "@/lib/utils";

export function RecoveryEmailForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const viewer = useViewer();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [step, setStep] = useState<"email" | "verify">("email");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const requestCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address that you can access.");
      return;
    }
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const result = await requestRecoveryEmailAction(normalizedEmail);
      if (!result.ok) {
        setError(result.message ?? "We could not send a verification code.");
        return;
      }
      setEmail(normalizedEmail);
      setMaskedEmail(result.maskedEmail ?? normalizedEmail);
      setCooldown(result.retryAfterSeconds ?? 60);
      setStep("verify");
      setSuccess("A six-digit verification code was sent to your recovery email.");
    } catch {
      setError("We could not send a verification code. Please try again shortly.");
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit verification code from your email.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const result = await verifyRecoveryEmailAction(code);
      if (!result.ok) {
        setError(result.message ?? "The verification code is invalid or expired.");
        return;
      }
      setSuccess("Recovery email verified. Redirecting you to LUNAS…");
      router.replace(safeReturnPath(returnTo));
      router.refresh();
    } catch {
      setError("We could not verify the recovery email. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void (step === "email" ? requestCode() : verifyCode());
  };

  return (
    <>
      <PageHeader
        eyebrow="Account security"
        title="Add a recovery email"
        description="Your authorized email remains your login name. Add another email so LUNAS can safely send password-reset instructions."
        breadcrumbs={[{ label: "Account Security" }]}
      />

      <Card className="max-w-2xl">
        <CardHeader
          title={step === "email" ? "Where should we send your code?" : "Enter your verification code"}
          description={step === "email" ? `Signed in as ${viewer.email}. This required step protects your account if you forget your password.` : `Check ${maskedEmail} for the six-digit code. Your authorized login email will not change.`}
          action={<ShieldCheck className="size-5 text-brand-700" aria-label="Recovery email security" />}
        />
        <form onSubmit={submit} className="space-y-5 p-5" noValidate aria-busy={pending}>
          {error ? <AuthAlert tone="error" title="Recovery email not saved" assertive>{error}</AuthAlert> : null}
          {success ? <AuthAlert tone="success" title="Security update" assertive>{success}</AuthAlert> : null}

          {step === "email" ? (
            <FormField
              id="recovery-email"
              label="Recovery email"
              required
              type="email"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError(""); }}
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.com"
              helperText="Use a mailbox you can open. It must be different from your authorized login email."
              disabled={pending}
            />
          ) : (
            <>
              <FormField
                id="recovery-email"
                label="Recovery email"
                value={maskedEmail}
                readOnly
                leading={<Mail className="size-4" aria-hidden="true" />}
              />
              <FormField
                id="recovery-email-code"
                label="Verification code"
                required
                value={code}
                onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                helperText="The code expires after a short time. Never share it with anyone."
                disabled={pending}
              />
            </>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" loading={pending} loadingLabel={step === "email" ? "Sending code…" : "Verifying…"}>
              {step === "email" ? <><Mail className="size-4" aria-hidden="true" /> Send verification code</> : <><CheckCircle2 className="size-4" aria-hidden="true" /> Verify recovery email</>}
            </Button>
            {step === "verify" ? (
              <Button type="button" variant="secondary" onClick={() => void requestCode()} disabled={pending || cooldown > 0}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <SecurityNotice>Recovery email changes are recorded for account security. LUNAS will never ask for your password or verification code.</SecurityNotice>
    </>
  );
}
