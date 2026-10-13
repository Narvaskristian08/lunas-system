import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetCodeForm } from "@/components/auth/reset-code-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new secure password for your LUNAS account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; openApp?: string | string[]; email?: string | string[] }>;
}) {
  const query = await searchParams;
  const tokenParam = Array.isArray(query.token) ? query.token[0] : query.token;
  const openAppParam = Array.isArray(query.openApp) ? query.openApp[0] : query.openApp;
  const initialTokenStatus = tokenParam ? "valid" : "invalid";

  return (
    <AuthShell
      eyebrow="Secure password reset"
      title="Create a new password"
      description="Use a strong, unique password for your authorized LUNAS account. Every requirement must be met before you can continue."
    >
      {tokenParam ? <ResetPasswordForm token={tokenParam} initialTokenStatus={initialTokenStatus} openInMobile={openAppParam === "1"} /> : <ResetCodeForm initialEmail={Array.isArray(query.email) ? query.email[0] : query.email} />}
    </AuthShell>
  );
}
