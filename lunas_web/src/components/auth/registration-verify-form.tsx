"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { resendRegistrationAction, verifyRegistrationAction, type RegistrationChallenge } from "@/app/actions/auth";
import { AuthAlert, AuthCard, BackToLogin, SecurityNotice } from "@/components/auth/auth-ui";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";

const storageKey = "lunas_registration_challenge";

export function RegistrationVerifyForm() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<RegistrationChallenge | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const loadChallenge = window.setTimeout(() => {
      if (!active) return;
      try {
        const saved = window.sessionStorage.getItem(storageKey);
        if (saved) setChallenge(JSON.parse(saved) as RegistrationChallenge);
      } catch {
        window.sessionStorage.removeItem(storageKey);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(loadChallenge);
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge || pending) return;
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the complete six-digit verification code.");
      return;
    }
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const result = await verifyRegistrationAction({ email: challenge.email, challengeToken: challenge.challengeToken, code });
      if (!result.ok) {
        setError(result.message ?? "The verification code is invalid or expired.");
        return;
      }
      window.sessionStorage.removeItem(storageKey);
      router.replace("/login?registered=1");
    } catch {
      setError("Registration verification is temporarily unavailable. Please try again later.");
    } finally {
      setPending(false);
    }
  };

  const resend = async () => {
    if (!challenge || pending || cooldown > 0) return;
    setPending(true);
    setError("");
    try {
      const result = await resendRegistrationAction({ email: challenge.email, challengeToken: challenge.challengeToken });
      if (!result.ok || !result.challenge) {
        setError(result.message ?? "We could not send a new verification code.");
        return;
      }
      setChallenge(result.challenge);
      setCode("");
      setCooldown(result.challenge.resendAfterSeconds);
      window.sessionStorage.setItem(storageKey, JSON.stringify(result.challenge));
      setSuccess("A new verification code was sent.");
    } catch {
      setError("We could not send a new verification code. Please try again later.");
    } finally {
      setPending(false);
    }
  };

  if (!ready) {
    return <AuthCard><p className="text-sm text-slate-600" role="status">Loading your registration session…</p></AuthCard>;
  }

  if (!challenge) {
    return (
      <AuthCard>
        <AuthAlert tone="info" title="Start registration again">
          This verification session is no longer available on this device.
          <Link className="mt-1 inline-block font-semibold underline underline-offset-2" href="/register">Return to registration</Link>
        </AuthAlert>
        <div className="mt-5"><BackToLogin /></div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <form onSubmit={submit} className="space-y-5" noValidate aria-busy={pending}>
        <div className="flex items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-950">
          <MailCheck className="size-5 shrink-0 text-brand-700" aria-hidden="true" />
          <p>We sent a LUNAS verification code to <span className="break-all font-semibold">{challenge.email}</span>.</p>
        </div>
        {error ? <AuthAlert tone="error" title="Verification could not continue" assertive>{error}</AuthAlert> : null}
        {success ? <AuthAlert tone="success" title="Email sent" assertive>{success}</AuthAlert> : null}
        <FormField
          id="registration-code"
          label="Six-digit verification code"
          required
          value={code}
          onChange={(event) => { setCode(event.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          helperText="The code expires after a short time. Check your spam folder if needed."
          disabled={pending}
          inputClassName="text-center text-xl font-bold tracking-[0.45em]"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" loading={pending} loadingLabel="Verifying…" disabled={!code.trim()}>
            <CheckCircle2 className="size-4.5" aria-hidden="true" /> Verify email
          </Button>
          <Button type="button" variant="secondary" onClick={() => void resend()} disabled={pending || cooldown > 0}>
            <RefreshCw className="size-4" aria-hidden="true" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Button>
        </div>
        <BackToLogin />
      </form>
      <SecurityNotice>After verification, LUNAS will keep you on the sign-in page. The email used here becomes the verified recovery destination for your citizen account.</SecurityNotice>
    </AuthCard>
  );
}
