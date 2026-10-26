"use server";

import { philippineDeadlineIso } from "@/lib/agency-schedule";
import { revalidatePath } from "next/cache";
import { backendRequest, isBackendApiError, responseData } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

function result(error: unknown) {
  if (isBackendApiError(error) && error.status < 500) return { ok: false, message: error.message };
  return { ok: false, message: "The Committee Staff workflow service is unavailable. Please try again." };
}

export async function getTanodPersonnel() {
  await requirePermission("reports.validate");
  const accessToken = await requireAccessToken();
  const response = await backendRequest<{ data?: unknown[] }>("/incidents/tanod-personnel", { accessToken });
  return responseData(response) as unknown[];
}

export async function assignTanodAction(incidentId: string, tanodId: string) {
  await requirePermission("reports.validate");
  try {
    const response = await backendRequest(`/incidents/${encodeURIComponent(incidentId)}/tanod-inspections`, { accessToken: await requireAccessToken(), method: "POST", body: JSON.stringify({ tanodId }) });
    revalidatePath(`/validation-routing/${incidentId}`); revalidatePath("/validation-routing");
    return { ok: true, message: response.message ?? "Committee Staff inspection assigned." };
  } catch (error) { return result(error); }
}

export async function reviewTanodAction(incidentId: string, inspectionId: string, decision: "approve" | "reject" | "clarification", notes: string) {
  await requirePermission("reports.validate");
  try {
    const response = await backendRequest(`/incidents/${encodeURIComponent(incidentId)}/inspections/${encodeURIComponent(inspectionId)}/review`, { accessToken: await requireAccessToken(), method: "POST", body: JSON.stringify({ decision, notes }) });
    revalidatePath(`/validation-routing/${incidentId}`); revalidatePath("/validation-routing");
    return { ok: true, message: response.message ?? "Committee Staff verification reviewed." };
  } catch (error) { return result(error); }
}

export async function updateAgencyStatusAction(incidentId: string, status: string, note: string, priority?: string, slaDeadline?: string) {
  await requirePermission("work_orders.manage");
  try {
    const deadline = slaDeadline ? philippineDeadlineIso(slaDeadline) : undefined;
    if (slaDeadline && !deadline) return { ok: false, message: "Enter a valid agency deadline in Philippine time." };
    const body = { status, note, priority, ...(deadline ? { slaDeadline: deadline } : {}) };
    const response = await backendRequest(`/incidents/${encodeURIComponent(incidentId)}/agency-status`, { accessToken: await requireAccessToken(), method: "PATCH", body: JSON.stringify(body) });
    revalidatePath(`/validation-routing/${incidentId}`); revalidatePath("/work-orders"); revalidatePath("/dashboard");
    return { ok: true, message: response.message ?? "Agency status updated." };
  } catch (error) { return result(error); }
}

export async function assignCompletionTanodAction(incidentId: string, tanodId: string) {
  await requirePermission("reports.validate");
  try {
    const response = await backendRequest(`/incidents/${encodeURIComponent(incidentId)}/completion-inspections`, { accessToken: await requireAccessToken(), method: "POST", body: JSON.stringify({ tanodId }) });
    revalidatePath(`/validation-routing/${incidentId}`); revalidatePath("/validation-routing");
    return { ok: true, message: response.message ?? "Final Committee Staff verification assigned." };
  } catch (error) { return result(error); }
}

export async function completeIncidentAction(incidentId: string, inspectionId: string, notes: string) {
  await requirePermission("reports.validate");
  try {
    const response = await backendRequest(`/incidents/${encodeURIComponent(incidentId)}/complete`, { accessToken: await requireAccessToken(), method: "POST", body: JSON.stringify({ inspectionId, notes }) });
    revalidatePath(`/validation-routing/${incidentId}`); revalidatePath("/validation-routing"); revalidatePath("/dashboard");
    return { ok: true, message: response.message ?? "Incident marked completed." };
  } catch (error) { return result(error); }
}

export async function requestAgencyCorrectionAction(incidentId: string, reason: string) {
  await requirePermission("reports.validate");
  if (!reason.trim()) return { ok: false, message: "A correction reason is required." };
  try {
    const response = await backendRequest(`/incidents/${encodeURIComponent(incidentId)}/agency-correction`, { accessToken: await requireAccessToken(), method: "POST", body: JSON.stringify({ reason }) });
    revalidatePath(`/validation-routing/${incidentId}`); revalidatePath("/validation-routing"); revalidatePath("/work-orders");
    return { ok: true, message: response.message ?? "Correction requested from the agency." };
  } catch (error) { return result(error); }
}
