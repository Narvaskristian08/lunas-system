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
      description="Enter your authorized login email address. Reset instructions are sent to the verified recovery email connected to that account."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}

