import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a citizen account for LUNAS and verify your email address.",
};

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Citizen registration"
      title="Create your LUNAS account"
      description="Register as a citizen, then enter the six-digit code sent to your email. Your account stays on the sign-in page until verification is complete."
      wide
    >
      <RegisterForm />
    </AuthShell>
  );
}
