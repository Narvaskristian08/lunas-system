"use client";

import { FormEvent, useEffect, useState } from "react";
import { requestPasswordResetAction, verifyPasswordResetCodeAction } from "@/app/actions/auth";
import { AuthCard, AuthAlert, BackToLogin } from "@/components/auth/auth-ui";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { ResetPasswordForm } from "./reset-password-form";

export function ResetCodeForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(initialEmail ? 60 : 0);
  useEffect(() => {
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await verifyPasswordResetCodeAction(email.trim(), code);
      if (result.ok && result.token) setToken(result.token);
      else setMessage(result.message || "Unable to verify the code.");
    } finally { setBusy(false); }
  }
  async function resend() {
    if (busy || cooldown > 0) return;
    setBusy(true);
    try {
      const result = await requestPasswordResetAction(email.trim());
      setMessage(result.ok ? "If the account matches, a new code will arrive shortly." : "Unable to send the code. Try again.");
      if (result.ok) setCooldown(60);
    } finally { setBusy(false); }
  }
  if (token) return <ResetPasswordForm token={token} />;
  return <AuthCard>
    <form onSubmit={verify} className="space-y-5">
      <h2 className="text-xl font-semibold">Verify your reset code</h2>
      <p className="text-sm text-slate-600">Enter the six-digit email code. It expires in 10 minutes.</p>
      <FormField id="reset-email" label="Account email" type="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
      <FormField id="reset-code" label="Verification code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} required disabled={busy} />
      {message ? <AuthAlert tone="warning" title="Verification">{message}</AuthAlert> : null}
      <Button type="submit" className="w-full" loading={busy} disabled={code.length !== 6 || busy}>Verify Code</Button>
      <Button type="button" variant="secondary" onClick={() => void resend()} disabled={cooldown > 0 || busy || !email.trim()}>{cooldown ? `Resend in ${cooldown}s` : "Send code again"}</Button>
      <BackToLogin />
    </form>
  </AuthCard>;
}
