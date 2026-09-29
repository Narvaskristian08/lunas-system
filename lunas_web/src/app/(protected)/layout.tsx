import { ApplicationShell } from "@/components/layout/application-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { requireWebWorkspace } from "@/lib/auth/dal.server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireWebWorkspace();
  return (
    <ProtectedRoute>
      <ApplicationShell>{children}</ApplicationShell>
    </ProtectedRoute>
  );
}
