import { exportOperationalReport } from "@/lib/operational-reports.server";
export async function GET(request: Request) { return exportOperationalReport(request, "utility_provider"); }
