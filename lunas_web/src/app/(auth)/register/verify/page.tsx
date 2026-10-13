import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegistrationVerifyForm } from "@/components/auth/registration-verify-form";

export const metadata: Metadata = {
  title: "Verify registration",
  description: "Verify the email address used to create a LUNAS citizen account.",
};

export default function RegistrationVerifyPage() {
  return (
    <AuthShell
      eyebrow="Citizen registration"
      title="Verify your email address"
      description="Enter the six-digit code from the LUNAS email to finish creating your account."
    >
      <RegistrationVerifyForm />
    </AuthShell>
  );
}
