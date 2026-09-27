"use client";

import Link from "next/link";
import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { BadgeCheck, Clock3, Mail, RefreshCw } from "lucide-react";
import { AuthAlert, AuthCard, BackToLogin, SecurityNotice } from "@/components/auth/auth-ui";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { resendVerificationAction, verifyAccountAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type VerificationState = "waiting" | "verifying" | "success" | "failed" | "link-expired" | "code-expired" | "code-invalid" | "already";

export function VerificationForm({
  email,
  initialCooldown = 0,
  developmentCode,
  initialStatus = "waiting",
}: {
  email?: string;
  initialCooldown?: number;
  developmentCode?: string;
  initialStatus?: Exclude<VerificationState, "verifying" | "success">;
}) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<VerificationState>(initialStatus);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"success" | "offline" | "error" | null>(null);
  const [failureKind, setFailureKind] = useState<"offline" | "server">("server");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const { online, checked } = useConnectivity();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function updateDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    if (status === "code-invalid" || status === "code-expired" || status === "failed") setStatus("waiting");
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      setDigits((current) => current.map((item, itemIndex) => itemIndex === index - 1 ? "" : item));
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => pasted[index] ?? "");
    setDigits(next);
    inputs.current[Math.min(pasted.length, 6) - 1]?.focus();
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "verifying" || digits.some((digit) => !digit)) return;
    if (checked && !online) {
      setFailureKind("offline");
      setStatus("failed");
      return;
    }
    const code = digits.join("");
    setStatus("verifying");
    try {
      const result = await verifyAccountAction(code);
      if (!result.ok) {
        if (result.code === "invalid") setStatus("code-invalid");
        else if (result.code === "expired") setStatus("code-expired");
        else {
          setFailureKind("server");
          setStatus("failed");
        }
        return;
      }
      setStatus("success");
    } catch {
      setFailureKind("server");
      setStatus("failed");
    }
  }

  async function resend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendStatus(null);
    try {
      const result = await resendVerificationAction();
      if (!result.ok) {
        setResendStatus("error");
        return;
      }
      setCooldown(result.retryAfterSeconds ?? 30);
      setResendStatus("success");
      setStatus("waiting");
      setDigits(["", "", "", "", "", ""]);
      window.setTimeout(() => inputs.current[0]?.focus(), 0);
    } catch {
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  }

  if (status === "success" || status === "already") {
    const already = status === "already";
    return (
      <AuthCard className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <BadgeCheck className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">{already ? "Verification already complete" : "Security verification complete"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" role="status">
          {already ? "No further verification is needed." : "Your identity check is complete. LUNAS is opening your workspace."}
        </p>
        <Link href="/login" className={buttonStyles({ size: "lg", className: "mt-6 w-full" })}>Continue to sign in</Link>
      </AuthCard>
    );
  }

  if (status === "link-expired") {
    return (
      <AuthCard className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <Clock3 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">Verification link expired</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Request a new verification code to continue. Your assigned account has not been changed.</p>
        {resendStatus ? <ResendAlert status={resendStatus} /> : null}
        <Button type="button" size="lg" className="mt-6 w-full" onClick={() => void resend()} loading={resending} loadingLabel="Sending a new code…" disabled={cooldown > 0}>
          <RefreshCw className="size-4" aria-hidden="true" />
          {cooldown > 0 ? `Try again in ${cooldown}s` : "Send a new code"}
        </Button>
        <div className="mt-2"><BackToLogin /></div>
      </AuthCard>
    );
  }

  const incomplete = digits.some((digit) => !digit);
  return (
    <AuthCard>
      <div className="mb-5 flex items-start gap-3 rounded-xl bg-brand-50 p-4 text-brand-900">
        <Mail className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Enter your six-digit code</p>
          <p className="mt-0.5 text-xs leading-5 text-brand-800/80">
            We sent a time-limited verification code{email ? <> to <span className="break-all font-semibold">{email}</span></> : " to your assigned email address"}.
          </p>
        </div>
      </div>

      {status === "code-invalid" ? (
        <AuthAlert tone="error" title="That code is not valid" assertive>Check all six digits and try again.</AuthAlert>
      ) : status === "code-expired" ? (
        <AuthAlert tone="warning" title="That code has expired" assertive>Request a new code below.</AuthAlert>
      ) : status === "failed" ? (
        <AuthAlert tone={failureKind === "offline" ? "warning" : "error"} title={failureKind === "offline" ? "No internet connection" : "Verification could not be completed"} assertive>
          {failureKind === "offline" ? "Reconnect and try again. Your code remains in the form." : "The verification service is temporarily unavailable. Please try again shortly."}
        </AuthAlert>
      ) : null}
      {resendStatus ? <ResendAlert status={resendStatus} /> : null}

      <form onSubmit={verify} className="mt-5" aria-busy={status === "verifying"}>
        <fieldset>
          <legend className="sr-only">Six-digit security verification code</legend>
          <div className="grid grid-cols-6 gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputs.current[index] = element; }}
                value={digit}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                className={cn("h-13 min-w-0 rounded-xl border bg-white text-center font-mono text-xl font-bold text-slate-950 shadow-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100 sm:h-14", status === "code-invalid" && "border-red-500")}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                aria-label={`Verification code digit ${index + 1} of 6`}
                aria-invalid={status === "code-invalid"}
                disabled={status === "verifying"}
                autoFocus={index === 0}
              />
            ))}
          </div>
        </fieldset>

        {developmentCode ? (
          <p className="mt-3 text-center text-xs text-slate-500">Local QA code: <span className="font-mono font-semibold">{developmentCode}</span></p>
        ) : null}

        <Button className="mt-5 w-full" size="lg" type="submit" loading={status === "verifying"} loadingLabel="Verifying code…" disabled={incomplete || (checked && !online)}>
          Verify and sign in
        </Button>
      </form>

      <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-4 sm:flex-row">
        <BackToLogin />
        <Button type="button" variant="ghost" onClick={() => void resend()} loading={resending} loadingLabel="Sending…" disabled={cooldown > 0}>
          <RefreshCw className="size-4" aria-hidden="true" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </Button>
      </div>
      <SecurityNotice>Verification codes expire quickly and can be used only once. Do not share this code with anyone.</SecurityNotice>
    </AuthCard>
  );
}

function ResendAlert({ status }: { status: "success" | "offline" | "error" }) {
  if (status === "success") return <AuthAlert className="mt-4 text-left" tone="success" title="A new code was sent">Use the newest code in your inbox. Earlier codes may no longer work.</AuthAlert>;
  if (status === "offline") return <AuthAlert className="mt-4 text-left" tone="warning" title="No internet connection" assertive>Reconnect before requesting another code.</AuthAlert>;
  return <AuthAlert className="mt-4 text-left" tone="error" title="Code could not be sent" assertive>The verification service is temporarily unavailable. Please try again shortly.</AuthAlert>;
}
