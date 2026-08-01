import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new secure password for your LUNAS account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; status?: string | string[] }>;
}) {
  const query = await searchParams;
  const tokenParam = Array.isArray(query.token) ? query.token[0] : query.token;
  const statusParam = Array.isArray(query.status) ? query.status[0] : query.status;
  const initialTokenStatus = statusParam === "expired" || tokenParam === "expired"
    ? "expired"
    : statusParam === "invalid" || tokenParam === "invalid"
      ? "invalid"
      : "valid";

  return (
    <AuthShell
      eyebrow="Secure password reset"
      title="Create a new password"
      description="Use a strong, unique password for your authorized LUNAS account. Every requirement must be met before you can continue."
    >
      <ResetPasswordForm token={tokenParam ?? "lunas-preview-reset-token"} initialTokenStatus={initialTokenStatus} />
    </AuthShell>
  );
}

