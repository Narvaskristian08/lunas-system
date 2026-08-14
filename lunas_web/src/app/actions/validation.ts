"use server";

import { revalidatePath } from "next/cache";
import { BackendApiError, backendRequest } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

export type ValidationActionResult = {
  ok: boolean;
  message: string;
  conflict?: boolean;
};

type Jurisdiction = {
  barangay?: string;
  city?: string;
  responsibility?: "barangay" | "city_engineering" | "utility_provider";
};

type Routing = {
  responsibleOrganization?: string;
  responsibleRole?: "barangay" | "city_engineering" | "utility_provider";
  reason?: string;
};

const safeText = (value: string | undefined, maximum: number) => value?.trim().slice(0, maximum) || undefined;

async function callDecision(path: string, body: Record<string, unknown>): Promise<ValidationActionResult> {
  await requirePermission("reports.validate");
  const accessToken = await requireAccessToken();
  try {
    await backendRequest(path, { method: "POST", accessToken, body: JSON.stringify(body) });
    revalidatePath("/validation-routing");
    revalidatePath("/dashboard");
    return { ok: true, message: "Decision recorded." };
  } catch (error) {
    if (error instanceof BackendApiError) {
      return {
        ok: false,
        conflict: error.status === 409,
        message: error.status === 409
          ? "This report was changed by another official. The latest data has been requested."
          : error.message,
      };
    }
    return { ok: false, message: "LUNAS could not save this decision. Please try again." };
  }
}

export async function validateIncidentAction(input: {
  incidentId: string;
  priority: "critical" | "high" | "medium" | "low";
  jurisdiction: Jurisdiction;
  routing: Routing;
  notes?: string;
}): Promise<ValidationActionResult> {
  if (!input.incidentId || !input.jurisdiction.barangay || !input.routing.responsibleOrganization || !input.routing.responsibleRole) {
    return { ok: false, message: "Priority, barangay, and responsible organization are required." };
  }
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/validate`, {
    priority: input.priority,
    jurisdiction: {
      barangay: safeText(input.jurisdiction.barangay, 100),
      city: safeText(input.jurisdiction.city, 100),
      responsibility: input.jurisdiction.responsibility,
    },
    routing: {
      responsibleOrganization: safeText(input.routing.responsibleOrganization, 160),
      responsibleRole: input.routing.responsibleRole,
      reason: safeText(input.routing.reason, 1000),
    },
    notes: safeText(input.notes, 2000),
  });
}

export async function rejectIncidentAction(input: {
  incidentId: string;
  reason: string;
  notes?: string;
}): Promise<ValidationActionResult> {
  const reason = safeText(input.reason, 500);
  if (!input.incidentId || !reason) return { ok: false, message: "A rejection reason is required." };
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/reject`, {
    reason,
    notes: safeText(input.notes, 2000),
  });
}

export async function markDuplicateAction(input: {
  incidentId: string;
  duplicateOf: string;
  reason: string;
  notes?: string;
}): Promise<ValidationActionResult> {
  const reason = safeText(input.reason, 500);
  if (!input.incidentId || !input.duplicateOf || !reason) {
    return { ok: false, message: "Select a canonical report and provide a duplicate reason." };
  }
  return callDecision(`/incidents/${encodeURIComponent(input.incidentId)}/mark-duplicate`, {
    duplicateOf: input.duplicateOf,
    reason,
    notes: safeText(input.notes, 2000),
  });
}
