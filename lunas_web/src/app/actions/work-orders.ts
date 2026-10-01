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
const maxEvidenceFiles = 5;
const maxEvidenceBytes = 10 * 1024 * 1024;

const safeText = (value: string | undefined, maximum: number) => value?.trim().slice(0, maximum) || undefined;
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
    throw new BackendApiError(403, "Only assigned repair personnel can perform this action.");
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
}): Promise<WorkOrderActionResult> {
  try {
    await requireUtilityProvider();
    const workOrderId = safeId(input.workOrderId);
    const assigneeId = safeId(input.assigneeId);
    if (!workOrderId || !assigneeId) return { ok: false, message: "Select an eligible repair person before assigning this work order." };
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/assign`,
      JSON.stringify({ assigneeId }),
      workOrderId,
      "Repair personnel assigned.",
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
  progressPercent: 25 | 50 | 75 | 100;
  notes?: string;
  location?: { longitude: number; latitude: number };
}): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const workOrderId = safeId(input.workOrderId);
    const notes = safeText(input.notes, 2000);
    const stage = repairProgressStages[input.progressPercent];
    if (!workOrderId || !stage) return { ok: false, message: "Choose a valid repair progress stage." };
    if (input.progressPercent === 100 && (!notes || notes.length < 2)) {
      return { ok: false, message: "Add a meaningful repair note before marking this work order ready for completion." };
    }
    const hasCoordinates = input.location
      && Number.isFinite(input.location.longitude)
      && Number.isFinite(input.location.latitude)
      && input.location.longitude >= -180
      && input.location.longitude <= 180
      && input.location.latitude >= -90
      && input.location.latitude <= 90;
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/progress`,
      JSON.stringify({
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
      input.progressPercent === 100
        ? "Repair is ready for formal completion and verification."
        : "Repair progress updated.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not update repair progress. Please try again.");
  }
}

export async function completeRepairWorkAction(formData: FormData): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const workOrderId = safeId(String(formData.get("workOrderId") ?? ""));
    const notes = safeText(String(formData.get("notes") ?? ""), 2000);
    const fileValue = formData.get("finalEvidence");
    if (!workOrderId) return { ok: false, message: "This work-order reference is invalid." };
    if (!notes || notes.length < 2) return { ok: false, message: "Add a meaningful completion note before submitting repair completion." };
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
    upload.set("notes", notes);
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

export async function uploadRepairEvidenceAction(formData: FormData): Promise<WorkOrderActionResult> {
  try {
    await requireAssignedRepairPersonnel();
    const workOrderId = safeId(String(formData.get("workOrderId") ?? ""));
    const caption = safeText(String(formData.get("caption") ?? ""), 500);
    const progressUpdateId = safeId(String(formData.get("progressUpdateId") ?? ""));
    const files = formData.getAll("evidence").filter(isFile);
    if (!workOrderId) return { ok: false, message: "This work-order reference is invalid." };
    if (!files.length) return { ok: false, message: "Choose at least one image to upload." };
    if (files.length > maxEvidenceFiles) return { ok: false, message: `Upload no more than ${maxEvidenceFiles} images at once.` };
    for (const file of files) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (!allowedEvidenceTypes.has(file.type) || !["jpg", "jpeg", "png", "webp"].includes(extension ?? "")) {
        return { ok: false, message: "Repair evidence must be a JPEG, PNG, or WebP image with a matching file extension." };
      }
      if (file.size < 1 || file.size > maxEvidenceBytes) {
        return { ok: false, message: "Each repair evidence image must be no larger than 10 MB." };
      }
    }

    const upload = new FormData();
    for (const file of files) upload.append("evidence", file, file.name);
    if (caption) upload.set("caption", caption);
    if (progressUpdateId) upload.set("progressUpdateId", progressUpdateId);
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/evidence`,
      upload,
      workOrderId,
      "Repair evidence uploaded.",
    );
  } catch (error) {
    return failedAction(error, "LUNAS could not upload repair evidence. Please try again.");
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
        ? "Completion accepted and forwarded to City Engineering."
        : "Corrective work sent to Repair Personnel.",
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
      return { ok: false, message: "Add corrective instructions before returning work to Repair Personnel." };
    }
    return mutateWorkOrder(
      `/work-orders/${encodeURIComponent(workOrderId)}/coordinate-correction`,
      JSON.stringify({ instructions }),
      workOrderId,
      "Corrective work sent to Repair Personnel.",
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
