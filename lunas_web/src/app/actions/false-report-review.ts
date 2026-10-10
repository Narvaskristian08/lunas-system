"use server";

import { backendRequest, responseData, BackendApiError } from "@/lib/api/backend.server";
import { requirePermission, requireAccessToken } from "@/lib/auth/dal.server";

export interface ReviewData {
  review: null | { version: number; finding: string; history: {
    finding: string; reason: string; evidenceReference: string; reviewedAt: string;
  }[] };
  confirmedFindingsInScope: number;
  confirmedFindingsTotal?: number;
}
async function credentials() {
  const viewer = await requirePermission("reports.validate");
  if (!["barangay_official", "city_engineer", "admin"].includes(viewer.backendRole)) throw new Error("Review access denied");
  return requireAccessToken();
}
export async function loadFalseReportReview(id: string): Promise<ReviewData> {
  const accessToken = await credentials();
  return responseData(await backendRequest<ReviewData>(`/incidents/${encodeURIComponent(id)}/false-report-review`, { accessToken }));
}
export async function saveFalseReportReview(id: string, input: {
  finding: string; reason: string; evidenceReference: string; expectedVersion: number;
}): Promise<{ ok: boolean; message: string }> {
  const accessToken = await credentials();
  try {
    await backendRequest(`/incidents/${encodeURIComponent(id)}/false-report-review`, {
      accessToken, method: "POST", body: JSON.stringify(input),
    });
    return { ok: true, message: input.finding === "corrected"
      ? "Finding corrected. The audit history remains available."
      : "Finding recorded. Three active confirmed findings pause new report submissions." };
  } catch (error) {
    return { ok: false, message: error instanceof BackendApiError ? error.message : "Review could not be saved." };
  }
}
