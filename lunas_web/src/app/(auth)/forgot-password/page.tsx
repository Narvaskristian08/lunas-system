import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request secure LUNAS password reset instructions.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your sign-in password"
      description="Enter your account email to receive a six-digit code. Citizens receive it at their verified registration email; staff receive it at their verified recovery email."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

