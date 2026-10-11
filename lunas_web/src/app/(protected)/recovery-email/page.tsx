import type { Metadata } from "next";
import { RecoveryEmailForm } from "@/components/security/recovery-email-form";
import { safeReturnPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Add recovery email",
  description: "Secure your LUNAS account with a verified recovery email.",
};

export default async function RecoveryEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  return <RecoveryEmailForm returnTo={safeReturnPath(rawNext)} />;
}
