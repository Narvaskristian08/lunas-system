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
      description="Enter your account email. Citizens receive instructions at the verified email used during registration; staff receive them at their verified recovery email."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

