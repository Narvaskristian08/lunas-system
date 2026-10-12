import { AdminConsole } from "@/components/admin/admin-console";
import { backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import type { AuthorizedAccountPage } from "@/lib/authorized-accounts";

export default async function AuthorizedAccountsPage({ searchParams }: {
  searchParams: Promise<{ search?: string; page?: string; role?: string; status?: string; organization?: string }>;
}) {
  const viewer = await requirePermission("users.manage");
  const accessToken = await requireAccessToken();
  const filters = await searchParams;
  const search = (filters.search || "").slice(0, 100);
  const query = new URLSearchParams({ search, page: /^\d+$/.test(filters.page || "") ? filters.page! : "1" });
  const role = ["admin", "barangay_official", "city_engineer", "utility_provider", "repair_personnel"].includes(filters.role || "") ? filters.role! : "";
  const status = ["pending_activation", "active", "suspended", "deactivated"].includes(filters.status || "") ? filters.status! : "";
  const organization = (filters.organization || "").slice(0, 160);
  for (const [key, value] of Object.entries({ role, status, organization })) if (value) query.set(key, value);
  let data: AuthorizedAccountPage | undefined;
  try {
    data = responseData(await backendRequest<AuthorizedAccountPage>(`/users/authorized?${query}`, { accessToken }));
  } catch { /* Render the ordinary unavailable state below. */ }
  if (!data) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">Authorized accounts could not be loaded. Refresh to retry.</div>;
  return <AdminConsole data={data} viewerId={viewer.id} search={search} filters={{ role, status, organization }} />;
}
