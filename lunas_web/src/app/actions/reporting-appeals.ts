"use server";

import { backendRequest, responseData, BackendApiError } from "@/lib/api/backend.server";
import { getViewer, requireAccessToken } from "@/lib/auth/dal.server";

export interface ReportingAppeal {
  id: string;
  reporter?: { id: string; firstName?: string; lastName?: string; email?: string };
  assignedBarangay: string;
  explanation: string;
  evidenceReference: string;
  source: "online" | "offline";
  status: "pending" | "approved" | "rejected";
  version: number;
  reviewedAt?: string;
  reviewNotes?: string;
  decisionHistory?: Array<{ decision: string; reviewedAt?: string; notes?: string }>;
}

export interface ReportingAppealPage {
  appeals: ReportingAppeal[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

async function authorizedViewer() {
  const viewer = await getViewer();
  if (!viewer || !["barangay_official", "city_engineer", "admin"].includes(viewer.backendRole)) {
    throw new Error("Appeal review access denied");
  }
  return viewer;
}

export async function loadReportingAppeal(reporterId: string): Promise<ReportingAppeal | null> {
  await authorizedViewer();
  const accessToken = await requireAccessToken();
  return responseData(await backendRequest<ReportingAppeal | null>(`/reporting-appeals/reporter/${encodeURIComponent(reporterId)}`, { accessToken }));
}

export async function loadReportingAppeals(): Promise<ReportingAppealPage> {
  await authorizedViewer();
  const accessToken = await requireAccessToken();
  return responseData(await backendRequest<ReportingAppealPage>('/reporting-appeals?status=pending&limit=50', { accessToken }));
}

export async function reviewReportingAppeal(input: {
  appealId: string;
  decision: "approved" | "rejected";
  notes?: string;
  expectedVersion: number;
}): Promise<{ ok: boolean; message: string }> {
  await authorizedViewer();
  const accessToken = await requireAccessToken();
  try {
    await backendRequest(`/reporting-appeals/${encodeURIComponent(input.appealId)}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify({
        decision: input.decision,
        notes: input.notes?.trim() || "",
        expectedVersion: input.expectedVersion,
      }),
    });
    return { ok: true, message: input.decision === "approved" ? "Appeal approved and reporting access restored." : "Appeal rejected; reporting remains blocked." };
  } catch (error) {
    return { ok: false, message: error instanceof BackendApiError ? error.message : "Appeal could not be saved." };
  }
}
