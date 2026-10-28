"use server";

import { backendRequest, responseData, isBackendApiError } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import type { SlaRecommendation } from "@/lib/sla-recommendation";

export async function getSlaRecommendationAction(incidentId: string, priority: string): Promise<{ ok: true; data: SlaRecommendation } | { ok: false; message: string }> {
  await requirePermission("work_orders.manage");
  if (!/^[a-f\d]{24}$/i.test(incidentId) || !["critical", "high", "medium", "low"].includes(priority)) return { ok: false, message: "Select an agency priority for this report first." };
  try {
    const response = await backendRequest<SlaRecommendation>(`/incidents/${encodeURIComponent(incidentId)}/sla-recommendation`, {
      method: "POST", accessToken: await requireAccessToken(), body: JSON.stringify({ priority }),
    });
    return { ok: true, data: responseData(response) };
  } catch (error) {
    return { ok: false, message: isBackendApiError(error) && error.status < 500 ? error.message : "AI SLA recommendation is unavailable. You can still enter the agency deadline manually." };
  }
}
