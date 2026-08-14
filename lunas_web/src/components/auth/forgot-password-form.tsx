"use client";

import { FormEvent, useEffect, useState } from "react";
import { MailCheck, Send } from "lucide-react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { isValidEmail } from "@/lib/utils";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { AuthAlert, AuthCard, BackToLogin, SecurityNotice } from "@/components/auth/auth-ui";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [requestError, setRequestError] = useState<"offline" | "server" | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { online, checked } = useConnectivity();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function requestReset() {
    if (pending || cooldown > 0) return;
    const normalized = email.trim();
    if (!normalized) {
      setError("Enter the email address assigned to your account.");
      return;
    }
    if (!isValidEmail(normalized)) {
      setError("Enter an email in the format name@example.gov.ph.");
      return;
    }
    setError("");
    setRequestError(null);
    setPending(true);
    try {
      const result = await requestPasswordResetAction(normalized);
      if (!result.ok) {
        setRequestError("server");
        return;
      }
      setSent(true);
      setCooldown(result.retryAfterSeconds ?? 30);
    } catch {
      setRequestError("server");
    } finally {
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void requestReset();
  }

  return (
    <AuthCard>
      {sent ? (
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <MailCheck className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">Check your inbox</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600" role="status">
            If an authorized LUNAS account matches <span className="break-all font-semibold text-slate-800">{email.trim()}</span>, LUNAS has accepted the recovery request.
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">When reset-email delivery is configured for your organization, instructions will be sent shortly. For security, we cannot confirm whether an account exists.</p>

          {requestError ? (
            <AuthAlert className="mt-5 text-left" tone={requestError === "offline" ? "warning" : "error"} title={requestError === "offline" ? "Connection lost" : "Message not sent"} assertive>
              {requestError === "offline" ? "Reconnect and use Send again. Your email has been preserved." : "The service is temporarily unavailable. Wait a moment and try again."}
            </AuthAlert>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <BackToLogin />
            <Button type="button" variant="secondary" onClick={() => void requestReset()} loading={pending} loadingLabel="Sending…" disabled={cooldown > 0 || (checked && !online)}>
              <Send className="size-4" aria-hidden="true" />
              {cooldown > 0 ? `Send again in ${cooldown}s` : "Send again"}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate aria-busy={pending}>
          {checked && !online ? (
            <AuthAlert tone="warning" title="No internet connection" assertive>
              Reconnect to request reset instructions. Your email will remain here.
            </AuthAlert>
          ) : null}
          {requestError ? (
            <AuthAlert tone={requestError === "offline" ? "warning" : "error"} title={requestError === "offline" ? "Connection lost" : "Request failed"} assertive>
              {requestError === "offline" ? "Reconnect and try again." : "The service is temporarily unavailable. Please try again shortly."}
            </AuthAlert>
          ) : null}

          <FormField
            id="recovery-email"
            label="Authorized email address"
            required
            error={error}
            helperText="We will send instructions only if this address is registered."
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError("");
            }}
            name="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@agency.gov.ph"
            disabled={pending}
          />

          <Button className="w-full" size="lg" type="submit" loading={pending} loadingLabel="Sending instructions…" disabled={!email.trim() || (checked && !online)}>
            Send reset instructions
          </Button>
          <BackToLogin />
        </form>
      )}

      <SecurityNotice>Never share a password reset link or verification code. LUNAS support will never ask for your password.</SecurityNotice>
    </AuthCard>
  );
}
