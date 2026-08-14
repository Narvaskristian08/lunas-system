import { ViewerProvider } from "@/components/providers/viewer-provider";
import { requireViewer } from "@/lib/auth/dal.server";

export async function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer();
  return <ViewerProvider viewer={viewer}>{children}</ViewerProvider>;
}
