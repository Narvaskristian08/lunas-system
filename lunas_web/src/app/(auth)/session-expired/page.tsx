import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SessionExpiredCard } from "@/components/auth/session-expired-card";
import { safeReturnPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Session expired",
  description: "Your secure LUNAS session has ended.",
};

export default async function SessionExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; reason?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const reason = Array.isArray(query.reason) ? query.reason[0] : query.reason;

  return (
    <AuthShell
      eyebrow="Secure session notice"
      title="Session expired"
      description="Protected information is no longer available in this browser until you authenticate again."
    >
      <SessionExpiredCard returnTo={safeReturnPath(rawNext)} reason={reason} />
    </AuthShell>
  );
}

