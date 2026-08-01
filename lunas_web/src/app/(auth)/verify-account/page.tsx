import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerificationForm } from "@/components/auth/verification-form";

export const metadata: Metadata = {
  title: "Verify account",
  description: "Verify an assigned LUNAS user account.",
};

const supportedStatuses = ["waiting", "failed", "link-expired", "code-expired", "code-invalid", "already"] as const;
type SupportedStatus = (typeof supportedStatuses)[number];

export default async function VerifyAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[]; status?: string | string[] }>;
}) {
  const query = await searchParams;
  const email = Array.isArray(query.email) ? query.email[0] : query.email;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const initialStatus: SupportedStatus = supportedStatuses.includes(rawStatus as SupportedStatus)
    ? rawStatus as SupportedStatus
    : "waiting";

  return (
    <AuthShell
      eyebrow="Account verification"
      title="Verify your assigned account"
      description="Confirm access with the six-digit code sent to your authorized email address."
    >
      <VerificationForm email={email} initialStatus={initialStatus} />
    </AuthShell>
  );
}

