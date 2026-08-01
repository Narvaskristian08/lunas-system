import { ApplicationShell } from "@/components/layout/application-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ApplicationShell>{children}</ApplicationShell>
    </ProtectedRoute>
  );
}
