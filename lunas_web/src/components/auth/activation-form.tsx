"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { activateAccountAction } from "@/app/actions/auth";
import { AuthCard, BackToLogin } from "@/components/auth/auth-ui";
import { PasswordField } from "@/components/forms/password-field";
import { PasswordStrength } from "@/components/forms/password-strength";
import { Button } from "@/components/ui/button";

export function ActivationForm() {
  const token = useRef("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    token.current ||= new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    // Remove the secret from visible browser history immediately after reading.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return <AuthCard>{complete ? <div className="space-y-4"><h2 className="text-lg font-semibold">Account activated</h2><p role="status" className="text-sm text-slate-600">Your password is ready. Sign in to access your assigned workspace.</p><BackToLogin /></div>
    : <form className="space-y-5" onSubmit={event => {
      event.preventDefault();
      if (pending) return;
      if (!/^[a-f0-9]{64}$/.test(token.current)) { setMessage("Open the activation link from your email. Ask your administrator for a new link if needed."); return; }
      if (password !== confirmation) { setMessage("The passwords do not match."); return; }
      startTransition(async () => {
        try {
          const result = await activateAccountAction(token.current, password);
          if (result.ok) { token.current = ""; setPassword(""); setConfirmation(""); setComplete(true); }
          else setMessage(result.message || "Activation failed. Ask your administrator for a new link.");
        } catch { setMessage("Activation is temporarily unavailable. Please try again."); }
      });
    }}>
      <div><PasswordField id="activation-password" name="password" label="Create password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={pending} /><PasswordStrength password={password} /></div>
      <PasswordField id="activation-confirm" name="confirmation" label="Confirm password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={pending} />
      <p className="text-sm text-slate-600">Use at least 8 characters including uppercase, lowercase, and a number. The link expires and can be used once.</p>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      <Button type="submit" className="w-full" loading={pending} loadingLabel="Activating account…">Activate account</Button><BackToLogin />
    </form>}</AuthCard>;
}
