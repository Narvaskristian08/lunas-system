import { NextResponse } from "next/server";
import { backendRequest, responseData } from "@/lib/api/backend.server";
import { requireAccessToken } from "@/lib/auth/dal.server";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const accessToken = await requireAccessToken();
  const period = new URL(request.url).searchParams.get("period") || "monthly";
  const days = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const formatDate = (value: Date) => value.toISOString().slice(0, 10);
  const query = new URLSearchParams({ limit: "100", sortBy: "-createdAt", from: formatDate(start), to: formatDate(end) });
  const reports = responseData(await backendRequest<unknown>(`/incidents?${query.toString()}`, { accessToken }));
  const rows = Array.isArray(reports) ? reports : [];
  const lines = ["Report Number,Category,Status,Agency Status,Barangay,Description,Created At", ...rows.map((value) => { const item = value as { reportNumber?: string; category?: string; status?: string; agencyStatus?: string; description?: string; createdAt?: string; location?: { address?: { barangay?: string } } }; return [item.reportNumber, item.category, item.status, item.agencyStatus, item.location?.address?.barangay, item.description, item.createdAt].map(csv).join(","); })];
  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="agency-reports-${period}.csv"` } });
}
