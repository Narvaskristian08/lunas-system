import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthAlert, AuthCard, BackToLogin } from "@/components/auth/auth-ui";

export const metadata: Metadata = {
  title: "Verify account",
  description: "Account verification availability for LUNAS users.",
};

export default function VerifyAccountPage() {
  return (
    <AuthShell
      eyebrow="Account verification"
      title="Account verification is not available yet"
      description="This release does not send or accept online verification codes."
    >
      <AuthCard>
        <AuthAlert tone="info" title="Use your assigned sign-in details">
          If you cannot access your account, contact your organization or use
          password recovery when it has been enabled. No verification code was
          sent from this page.
        </AuthAlert>
        <div className="mt-5">
          <BackToLogin />
        </div>
      </AuthCard>
    </AuthShell>
  );
}
