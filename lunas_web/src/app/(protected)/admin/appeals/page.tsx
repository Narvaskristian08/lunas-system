import { ReportingAppealsConsole } from "@/components/admin/reporting-appeals-console";
import { loadReportingAppeals } from "@/app/actions/reporting-appeals";
import { requirePermission } from "@/lib/auth/dal.server";

export default async function ReportingAppealsPage() {
  await requirePermission("users.manage");
  let data;
  try {
    data = await loadReportingAppeals();
  } catch {
    data = { appeals: [], pagination: { page: 1, limit: 50, total: 0, pages: 1 } };
  }
  return <ReportingAppealsConsole data={data} />;
}
