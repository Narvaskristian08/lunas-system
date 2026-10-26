import { TanodAccountManager } from "@/components/validation/tanod-account-manager";
import { requirePermission } from "@/lib/auth/dal.server";
import { getTanodAccounts } from "@/lib/validation.server";

type TanodAccount = Awaited<ReturnType<typeof getTanodAccounts>>[number];

export default async function TanodAccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const viewer = await requirePermission("reports.validate");
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const message = typeof params.created === "string" ? `Committee Staff account created${params.warning ? "; activation email was not delivered" : " and invitation sent"}.` : undefined;
  let tanods: TanodAccount[] = [];
  try { tanods = await getTanodAccounts(); } catch { /* The page can still show the creation action if the roster is temporarily unavailable. */ }
  return <div className="mx-auto w-full max-w-7xl"><TanodAccountManager tanods={tanods} barangay={viewer.barangay} message={message} error={error} /></div>;
}
