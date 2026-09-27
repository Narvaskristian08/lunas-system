import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerificationForm } from "@/components/auth/verification-form";
import { readPendingPrivilegedMfa } from "@/lib/auth/mfa-challenge.server";

export const metadata: Metadata = {
  title: "Security verification",
  description: "Complete multi-factor authentication for a privileged LUNAS account.",
};

export default async function VerifyAccountPage() {
  const challenge = await readPendingPrivilegedMfa();
  if (!challenge) redirect("/login");
  return (
    <AuthShell
      eyebrow="Privileged account security"
      title="Complete security verification"
      description="Enter the one-time code sent to your assigned email before LUNAS opens your workspace."
    >
      <VerificationForm
        email={challenge.email}
        initialCooldown={challenge.resendAfterSeconds}
        developmentCode={challenge.developmentCode}
      />
    </AuthShell>
  );
}
