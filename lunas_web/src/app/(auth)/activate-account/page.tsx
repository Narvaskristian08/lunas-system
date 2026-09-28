import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ActivationForm } from "@/components/auth/activation-form";

export const metadata: Metadata = { title: "Activate account", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function ActivateAccountPage() {
  return <AuthShell eyebrow="Authorized account activation" title="Set up your account"
    description="Your organization has approved your access. Choose your own password to activate the account provisioned by your LUNAS administrator.">
    <ActivationForm />
  </AuthShell>;
}
