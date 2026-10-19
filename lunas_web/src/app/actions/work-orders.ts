"use server";

import { revalidatePath } from "next/cache";
import { BackendApiError, backendRequest } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";
import { repairProgressStages } from "@/lib/work-order-progress";

export type WorkOrderActionResult = {
  ok: boolean;
  message: string;
  conflict?: boolean;
  workOrderId?: string;
};

const allowedEvidenceTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const maxEvidenceBytes = 10 * 1024 * 1024;

const safeText = (value: string | undefined, maximum: number) => {
  const text = value?.trim();
  if (text && text.length > maximum) throw new BackendApiError(400, `This field must contain no more than ${maximum} characters.`);
  return text || undefined;
};
const safeId = (value: string | undefined) => safeText(value, 100);

function responseRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function workOrderIdFrom(value: unknown) {
  const source = responseRecord(value);
  const id = source.id ?? source._id;
  return typeof id === "string" ? id : undefined;
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value === "object"
    && value !== null
    && "arrayBuffer" in value
    && "name" in value
    && "size" in value
    && "type" in value;
}

async function requireUtilityProvider() {
  const viewer = await requirePermission("work_orders.manage");
  if (viewer.backendRole !== "utility_provider") {
    throw new BackendApiError(403, "Only your assigned Utility Provider organization can manage these work orders.");
  }
  return viewer;
}

async function requireCityEngineer() {
  const viewer = await requirePermission("repairs.verify");
  if (viewer.backendRole !== "city_engineer") {
    throw new BackendApiError(403, "Only City Engineering can make the final repair decision.");
  }
  return viewer;
}

async function requireAssignedRepairPersonnel() {
  const viewer = await requirePermission("work_orders.manage");
  if (viewer.backendRole !== "repair_personnel") {
    throw new BackendApiError(403, "Only assigned utility personnel can perform this action.");
  }
  return viewer;
}

function revalidateWorkOrderViews(workOrderId?: string) {
  revalidatePath("/work-orders");
  revalidatePath("/sla");
  revalidatePath("/dashboard");
  if (workOrderId) revalidatePath(`/work-orders/${encodeURIComponent(workOrderId)}`);
}

function failedAction(error: unknown, fallback: string): WorkOrderActionResult {
  if (error instanceof BackendApiError) {
    return {
      ok: false,
      conflict: error.status === 409,
      message: error.status === 409
        ? "This work order changed while you were viewing it. Refresh to see the latest state before trying again."
        : error.message,
    };
  }
  return { ok: false, message: fallback };
}

async function mutateWorkOrder(
  path: string,
  body: BodyInit | undefined,
  workOrderId: string | undefined,
  successMessage: string,
): Promise<WorkOrderActionResult> {
  const accessToken = await requireAccessToken();
  try {
    const response = await backendRequest<unknown>(path, { method: "POST", accessToken, body });
    const createdId = workOrderIdFrom(response.data) ?? workOrderId;
    revalidateWorkOrderViews(createdId);
    return { ok: true, message: response.message || successMessage, workOrderId: createdId };
  } catch (error) {
    return failedAction(error, "LUNAS could not save this work-order action. Please try again.");
  }
}

export async function createWorkOrderAction(input: {
  incidentId: string;
  instructions?: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireUtilityProvider();
    const incidentId = safeId(input.incidentId);
    if (!incidentId) return { ok: false, message: "A validated incident is required before creating a work order." };
    const result = await mutateWorkOrder(
      `/incidents/${encodeURIComponent(incidentId)}/work-orders`,
      JSON.stringify({ instructions: safeText(input.instructions, 4000) }),
      undefined,
      "Work order created and ready for assignment.",
    );
    if (result.ok) {
      revalidatePath("/work-orders/intake");
      revalidatePath(`/work-orders/intake/${encodeURIComponent(incidentId)}`);
      revalidatePath(`/validation-routing/${encodeURIComponent(incidentId)}`);
    }
    return result;
  } catch (error) {
    return failedAction(error, "LUNAS could not create this work order. Please try again.");
  }
}

export async function assignWorkOrderAction(input: {
  workOrderId: string;
  assigneeId: string;
  instructions?: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireUtilityProvider();
    const workOrderId = safeId(input.workOrderId);
    const assigneeId = safeId(input.assigneeId);
    if (!workOrderId || !assigneeId) return { ok: false, message: "Select an eligible repair person before assigning this work order." };
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/assign`,
      JSON.stringify({ assigneeId, instructions: safeText(input.instructions, 4000) }),
      workOrderId,
      "Utility personnel assigned.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not assign this work order. Please try again.");
  }
}

export async function reassignWorkOrderAction(input: {
  workOrderId: string;
  assigneeId: string;
  reason: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireUtilityProvider();
    const workOrderId = safeId(input.workOrderId);
    const assigneeId = safeId(input.assigneeId);
    const reason = safeText(input.reason, 500);
    if (!workOrderId || !assigneeId || !reason || reason.length < 2) {
      return { ok: false, message: "Select an eligible repair person and provide a reassignment reason." };
    }
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/reassign`,
      JSON.stringify({ assigneeId, reason }),
      workOrderId,
      "Work order reassigned.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not reassign this work order. Please try again.");
  }
}

export async function acceptWorkOrderAction(workOrderId: string): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const id = safeId(workOrderId);
    if (!id) return { ok: false, message: "This work-order reference is invalid." };
    return mutateWorkOrder(`/work-orders/${encodeURIComponent(id)}/accept`, JSON.stringify({}), id, "Assignment accepted.");
  } catch (error) {
    return failedAction(error, "LUNAS could not accept this assignment. Please try again.");
  }
}

export async function declineWorkOrderAction(input: {
  workOrderId: string;
  reason: string;
  notes?: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const workOrderId = safeId(input.workOrderId);
    const reason = safeText(input.reason, 500);
    if (!workOrderId || !reason || reason.length < 2) {
      return { ok: false, message: "A decline reason is required." };
    }
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/decline`,
      JSON.stringify({ reason, notes: safeText(input.notes, 2000) }),
      workOrderId,
      "Assignment declined. The work order is available for reassignment.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not decline this assignment. Please try again.");
  }
}

export async function startWorkOrderAction(workOrderId: string): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const id = safeId(workOrderId);
    if (!id) return { ok: false, message: "This work-order reference is invalid." };
    return mutateWorkOrder(`/work-orders/${encodeURIComponent(id)}/start`, JSON.stringify({}), id, "Repair work started.");
  } catch (error) {
    return failedAction(error, "LUNAS could not start this repair. Please try again.");
  }
}

export async function updateRepairProgressAction(input: {
  workOrderId: string;
  progressPercent: number;
  notes?: string;
  location?: { longitude: number; latitude: number };
}): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const workOrderId = safeId(input.workOrderId);
    const notes = safeText(input.notes, 2000);
    const stage = repairProgressStages[input.progressPercent as keyof typeof repairProgressStages];
    if (!workOrderId || !stage) return { ok: false, message: "Refresh this work order before adding an update." };
    if (!notes) return { ok: false, message: "Describe the work performed before saving." };
    const hasCoordinates = input.location
      && Number.isFinite(input.location.longitude)
      && Number.isFinite(input.location.latitude)
      && input.location.longitude >= -180
      && input.location.longitude <= 180
      && input.location.latitude >= -90
      && input.location.latitude <= 90;
    if (!hasCoordinates) return { ok: false, message: "A current field location is required." };
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/progress`,
      JSON.stringify({
        updateType: "note",
        progressPercent: input.progressPercent,
        stage,
        notes,
        ...(hasCoordinates ? {
          location: {
            type: "Point",
            coordinates: [input.location!.longitude, input.location!.latitude],
          },
        } : {}),
      }),
      workOrderId,
      "Repair field update saved.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not update repair progress. Please try again.");
  }
}

export async function completeRepairWorkAction(formData: FormData): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const workOrderId = safeId(String(formData.get("workOrderId") ?? ""));
    const fileValue = formData.get("finalEvidence");
    if (!workOrderId) return { ok: false, message: "This work-order reference is invalid." };
    if (!fileValue || !isFile(fileValue)) return { ok: false, message: "Final post-maintenance evidence is required." };
    const extension = fileValue.name.split(".").pop()?.toLowerCase();
    if (!allowedEvidenceTypes.has(fileValue.type) || !["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) {
      return { ok: false, message: "Final evidence must be a JPEG, PNG, or WebP image with a matching file extension." };
    }
    if (fileValue.size < 1 || fileValue.size > maxEvidenceBytes) {
      return { ok: false, message: "Final evidence must be no larger than 10 MB." };
    }
    const upload = new FormData();
    upload.set("progressPercent", "100");
    upload.set("stage", repairProgressStages[100]);
    upload.set("updateType", "completion");
    const longitude = Number(formData.get("longitude"));
    const latitude = Number(formData.get("latitude"));
    if (!formData.has("longitude") || !formData.has("latitude") || !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return { ok: false, message: "A current field location is required." };
    }
    upload.set("location", JSON.stringify({ type: "Point", coordinates: [longitude, latitude] }));
    upload.append("evidence", fileValue, fileValue.name);
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/progress`,
      upload,
      workOrderId,
      "Repair completed and sent to the Utility Provider for review.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not submit the final repair evidence. Please try again.");
  }
}

export async function reviewCompletedWorkAction(input: {
  workOrderId: string;
  decision: "accepted" | "request_correction";
  reason?: string;
  instructions?: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireUtilityProvider();
    const workOrderId = safeId(input.workOrderId);
    const reason = safeText(input.reason, 2000);
    const instructions = safeText(input.instructions, 4000);
    if (!workOrderId) return { ok: false, message: "This work-order reference is invalid." };
    if (input.decision === "request_correction" && !reason) {
      return { ok: false, message: "A reason is required before returning the work for correction." };
    }
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/provider-review`,
      JSON.stringify({ decision: input.decision, reason, instructions }),
      workOrderId,
      input.decision === "accepted"
        ? "Repair verified and report resolved."
        : "Corrective work sent to Utility Personnel.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not save the provider completion review. Please try again.");
  }
}

export async function coordinateCityCorrectionAction(input: {
  workOrderId: string;
  instructions: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireUtilityProvider();
    const workOrderId = safeId(input.workOrderId);
    const instructions = safeText(input.instructions, 4000);
    if (!workOrderId || !instructions || instructions.length < 2) {
      return { ok: false, message: "Add corrective instructions before returning work to Utility Personnel." };
    }
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/coordinate-correction`,
      JSON.stringify({ instructions }),
      workOrderId,
      "Corrective work sent to Utility Personnel.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not coordinate the corrective work. Please try again.");
  }
}

export async function finalReviewWorkOrderAction(input: {
  workOrderId: string;
  decision: "approved" | "return";
  reason?: string;
}): Promise<WorkOrderActionResult> {
  try {
    await requireCityEngineer();
    const workOrderId = safeId(input.workOrderId);
    const reason = safeText(input.reason, 2000);
    if (!workOrderId) return { ok: false, message: "This work-order reference is invalid." };
    if (input.decision === "return" && !reason) {
      return { ok: false, message: "A reason is required before returning work for correction." };
    }
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/final-review`,
      JSON.stringify({ decision: input.decision, reason }),
      workOrderId,
      input.decision === "approved"
        ? "Repair verified and incident resolved."
        : "Work returned to the Utility Provider for correction.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not save the final engineering review. Please try again.");
  }
}
