import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeReturnPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Secure sign-in for the LUNAS urban infrastructure command center.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const query = await searchParams;
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;

  return (
    <AuthShell
      title="Sign in to LUNAS"
      description="Access the authorized web command center for infrastructure monitoring, response coordination, and accountability."
      wide
    >
      <LoginForm returnTo={safeReturnPath(rawNext)} />
    </AuthShell>
  );
}
