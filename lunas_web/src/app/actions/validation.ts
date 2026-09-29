"use server";

import { revalidatePath } from "next/cache";
import { BackendApiError, backendRequest } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

export type ValidationActionResult = { ok: boolean; message: string; conflict?: boolean };
type Jurisdiction = { barangay?: string; city?: string };

const safeText = (value: string | undefined, maximum: number) => value?.trim().slice(0, maximum) || undefined;

async function callDecision(
  path: string,
  body: Record<string, unknown>,
  method: "POST" | "PATCH" = "POST",
): Promise<ValidationActionResult> {
  await requirePermission("reports.validate");
  const accessToken = await requireAccessToken();
  try {
    await backendRequest(path, { method, accessToken, body: JSON.stringify(body) });
    revalidatePath("/validation-routing");
    revalidatePath("/dashboard");
    revalidatePath("/work-orders");
    return { ok: true, message: "Decision recorded." };
  } catch (error) {
    if (error instanceof BackendApiError) {
      return {
        ok: false,
        conflict: error.status === 409,
        message: error.status === 409
          ? "This record changed during review. The latest data has been requested."
          : error.message,
      };
    }
    return { ok: false, message: "LUNAS could not save this decision. Please try again." };
  }
}

export async function validateIncidentAction(input: {
  incidentId: string;
  jurisdiction: Jurisdiction;
  notes?: string;
}): Promise<ValidationActionResult> {
  const barangay = safeText(input.jurisdiction.barangay, 100);
  if (!input.incidentId || !barangay) return { ok: false, message: "A barangay is required." };
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/validate`, {
    jurisdiction: { barangay, city: safeText(input.jurisdiction.city, 100) },
    notes: safeText(input.notes, 2000),
  });
}

export async function rejectIncidentAction(input: { incidentId: string; reason: string; notes?: string }) {
  const reason = safeText(input.reason, 500);
  if (!input.incidentId || !reason) return { ok: false, message: "A rejection reason is required." };
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/reject`, {
    reason, notes: safeText(input.notes, 2000),
  });
}

export async function markDuplicateAction(input: { incidentId: string; duplicateOf: string; reason: string; notes?: string }) {
  const reason = safeText(input.reason, 500);
  if (!input.incidentId || !input.duplicateOf || !reason) {
    return { ok: false, message: "Select a canonical report and provide a duplicate reason." };
  }
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/mark-duplicate`, {
    duplicateOf: input.duplicateOf, reason, notes: safeText(input.notes, 2000),
  });
}

export async function confirmIncidentAction(input: { incidentId: string; jurisdiction: Jurisdiction; notes?: string }) {
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/confirm`, {
    jurisdiction: {
      barangay: safeText(input.jurisdiction.barangay, 100),
      city: safeText(input.jurisdiction.city, 100),
    },
    notes: safeText(input.notes, 2000),
  });
}

export async function requestClarificationAction(input: { incidentId: string; reason: string }) {
  const reason = safeText(input.reason, 2000);
  if (!input.incidentId || !reason) return { ok: false, message: "A clarification reason is required." };
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/clarification`, { reason });
}

export async function assignIncidentPriorityAction(input: { incidentId: string; priority: "critical" | "high" | "medium" | "low" }) {
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/priority`, { priority: input.priority }, "PATCH");
}

export async function routeIncidentAction(input: { incidentId: string; organization: string; reason?: string }) {
  const organization = safeText(input.organization, 160);
  if (!input.incidentId || !organization) return { ok: false, message: "Select a Utility Provider organization." };
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/route`, {
    responsibleOrganization: organization,
    responsibleRole: "utility_provider",
    reason: safeText(input.reason, 1000),
  });
}
