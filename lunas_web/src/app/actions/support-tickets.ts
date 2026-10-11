"use server";

import { revalidatePath } from "next/cache";
import { backendRequest, isBackendApiError } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

const categories = ["bug", "account_access", "data_issue", "feature_request", "other"] as const;
const priorities = ["low", "medium", "high", "urgent"] as const;
const statuses = ["open", "in_progress", "resolved", "closed"] as const;

function text(form: FormData, field: string) {
  return String(form.get(field) ?? "").trim();
}

export async function createSupportTicketAction(form: FormData) {
  await requirePermission("support.create");
  const accessToken = await requireAccessToken();
  const category = text(form, "category");
  const priority = text(form, "priority") || "medium";
  const subject = text(form, "subject");
  const description = text(form, "description");
  if (!categories.includes(category as typeof categories[number]) || !priorities.includes(priority as typeof priorities[number])) {
    return { ok: false, message: "Choose a valid ticket category and priority." };
  }
  try {
    const response = await backendRequest("/support-tickets", {
      method: "POST",
      accessToken,
      body: JSON.stringify({ category, priority, subject, description }),
    });
    revalidatePath("/help");
    revalidatePath("/admin/tickets");
    return { ok: true, message: response.message ?? "Support ticket submitted." };
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) return { ok: false, message: error.message };
    return { ok: false, message: "The support service is unavailable. Please try again shortly." };
  }
}

export async function updateSupportTicketAction(id: string, form: FormData) {
  await requirePermission("support.manage");
  const accessToken = await requireAccessToken();
  if (!/^[a-f\d]{24}$/i.test(id)) return { ok: false, message: "Invalid support ticket." };
  const status = text(form, "status");
  const priority = text(form, "priority");
  const adminResponse = text(form, "adminResponse");
  if (!statuses.includes(status as typeof statuses[number]) || !priorities.includes(priority as typeof priorities[number])) {
    return { ok: false, message: "Choose a valid status and priority." };
  }
  try {
    const response = await backendRequest(`/support-tickets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      accessToken,
      body: JSON.stringify({ status, priority, adminResponse }),
    });
    revalidatePath("/admin/tickets");
    revalidatePath("/help");
    return { ok: true, message: response.message ?? "Support ticket updated." };
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) return { ok: false, message: error.message };
    return { ok: false, message: "The support service is unavailable. Refresh before retrying." };
  }
}
