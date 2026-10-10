import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeReturnPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Secure sign-in for the LUNAS urban infrastructure command center.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;

  return (
    <AuthShell
      title="Sign in to LUNAS"
      description="Access the authorized web command center for infrastructure monitoring, response coordination, and accountability."
      wide
    >
      <LoginForm
        returnTo={safeReturnPath(rawNext)}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        captchaDisabled={process.env.LUNAS_DISABLE_LOGIN_CAPTCHA === "true" || (
          process.env.NODE_ENV !== "production" &&
          process.env.NEXT_PUBLIC_LUNAS_DISABLE_LOGIN_CAPTCHA === "true"
        )}
      />
    </AuthShell>
  );
}
