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
  createdAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  decisionHistory?: Array<{ decision: string; reviewedAt?: string; notes?: string }>;
}

export interface ReportingAppealPage {
  appeals: ReportingAppeal[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface ReportingAppealApiResponse {
  pagination?: ReportingAppealPage["pagination"];
}

async function authorizedViewer() {
  const viewer = await getViewer();
  if (!viewer || viewer.backendRole !== "barangay_official") {
    throw new Error("Appeal review access denied");
  }
  return viewer;
}

export async function loadReportingAppeals({
  status = "pending",
  page = 1,
  limit = 50,
}: {
  status?: "pending" | "completed" | "approved" | "rejected";
  page?: number;
  limit?: number;
} = {}): Promise<ReportingAppealPage> {
  await authorizedViewer();
  const accessToken = await requireAccessToken();
  const params = new URLSearchParams({ status, page: String(Math.max(1, page)), limit: String(Math.min(50, Math.max(1, limit))) });
  const response = await backendRequest<ReportingAppeal[]>(`/reporting-appeals?${params.toString()}`, { accessToken });
  const appeals = responseData(response);
  const pagination = (response as unknown as ReportingAppealApiResponse).pagination;
  return {
    appeals,
    pagination: pagination ?? { page: 1, limit: Math.min(50, Math.max(1, limit)), total: appeals.length, pages: 1 },
  };
}

export async function loadReportingAppealHistory(page = 1): Promise<ReportingAppealPage> {
  return loadReportingAppeals({ status: "completed", page, limit: 5 });
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
