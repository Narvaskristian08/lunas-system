"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    action: string;
    theme: "auto";
    size: "flexible";
    responseField: false;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({
  siteKey,
  resetKey,
  onVerificationChange,
}: {
  siteKey: string;
  resetKey: string;
  onVerificationChange: (verified: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState("");

  const clearToken = useCallback(() => {
    setToken("");
    onVerificationChange(false);
  }, [onVerificationChange]);

  const renderWidget = useCallback(() => {
    if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action: "login",
      theme: "auto",
      size: "flexible",
      responseField: false,
      callback: (nextToken) => {
        setToken(nextToken);
        onVerificationChange(true);
      },
      "expired-callback": clearToken,
      "error-callback": clearToken,
    });
  }, [clearToken, onVerificationChange, siteKey]);

  useEffect(() => {
    if (!widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    clearToken();
  }, [clearToken, resetKey]);

  if (!siteKey) {
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800" role="alert">
        Secure CAPTCHA is not configured. Contact the system administrator.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="min-h-16" aria-label="CAPTCHA verification" />
      <input type="hidden" name="captchaToken" value={token} />
    </div>
  );
}
