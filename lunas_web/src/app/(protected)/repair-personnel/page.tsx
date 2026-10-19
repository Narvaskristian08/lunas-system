import { RepairPersonnelConsole } from "@/components/repair-personnel/repair-personnel-console";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { getRepairPersonnel, type RepairPersonnelRecord } from "@/lib/repair-personnel.server";

export default async function RepairPersonnelPage() {
  const viewer = await requirePermission("personnel.manage");
  const accessToken = await requireAccessToken();
  let personnel: RepairPersonnelRecord[] = [];
  let error: string | undefined;

  try {
    personnel = await getRepairPersonnel(accessToken);
  } catch {
    error = "The Utility Personnel roster could not be loaded. Refresh to try again.";
  }

  return <RepairPersonnelConsole organization={viewer.utilityCompany ?? ""} personnel={personnel} error={error} />;
}
