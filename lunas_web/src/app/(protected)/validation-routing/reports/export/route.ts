import { exportPeriodReport } from "@/lib/report-export.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return exportPeriodReport(request, "barangay");
}
