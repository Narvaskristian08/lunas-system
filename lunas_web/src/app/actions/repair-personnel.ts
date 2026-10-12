"use server";

import { revalidatePath } from "next/cache";
import { BackendApiError, backendRequest, isBackendApiError } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

export type RepairPersonnelActionResult = { ok: boolean; message: string; warning?: boolean };

const fields = ["firstName", "middleName", "suffix", "lastName", "email", "phone", "repairTeam", "repairAccountType"] as const;

export async function createRepairPersonnelAction(form: FormData): Promise<RepairPersonnelActionResult> {
  const viewer = await requirePermission("personnel.manage");
  if (viewer.backendRole !== "utility_provider") {
    return { ok: false, message: "Only Utility Providers can add Repair Personnel." };
  }
  const accessToken = await requireAccessToken();
  const body = Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? "").trim()]));

  try {
    const response = await backendRequest<{ delivery?: { delivered?: boolean } }>("/users/repair-personnel", {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    });
    revalidatePath("/repair-personnel");
    revalidatePath("/work-orders");
    revalidatePath("/dashboard");
    return { ok: true, warning: response.data?.delivery?.delivered === false, message: response.message ?? "Repair Personnel account created." };
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) {
      const payload = error.payload as { errors?: Array<{ message?: string }> } | undefined;
      return { ok: false, message: payload?.errors?.[0]?.message || error.message };
    }
    if (error instanceof BackendApiError) return { ok: false, message: "The account service is unavailable. Refresh and try again." };
    return { ok: false, message: "The account service is unavailable. Refresh and try again." };
  }
}

export async function manageRepairPersonnelAction(id: string, operation: "edit" | "invite" | "status", form: FormData): Promise<RepairPersonnelActionResult> {
  const viewer = await requirePermission("personnel.manage");
  if (viewer.backendRole !== "utility_provider" || !/^[a-f0-9]{24}$/i.test(id)) return { ok: false, message: "Personnel account is unavailable." };
  const accessToken = await requireAccessToken();
  const version = Number(form.get("version"));
  const body = operation === "edit"
    ? { ...Object.fromEntries(fields.filter(field => field !== "email").map(field => [field, String(form.get(field) ?? "").trim()])), version }
    : operation === "status" ? { version, status: String(form.get("status")), reason: String(form.get("reason") ?? "").trim() } : { version };
  try {
    const response = await backendRequest<{ delivery?: { delivered?: boolean } }>(`/users/repair-personnel/${id}${operation === "invite" ? "/activation" : operation === "status" ? "/status" : ""}`, {
      method: operation === "invite" ? "POST" : operation === "status" ? "PATCH" : "PUT", accessToken, body: JSON.stringify(body),
    });
    revalidatePath("/repair-personnel"); revalidatePath("/work-orders"); revalidatePath("/dashboard");
    return { ok: true, warning: response.data?.delivery?.delivered === false, message: response.message ?? "Personnel account updated." };
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) {
      const payload = error.payload as { errors?: Array<{ message?: string }> } | undefined;
      return { ok: false, message: payload?.errors?.[0]?.message || error.message };
    }
    return { ok: false, message: "The account service is unavailable. Try again later." };
  }
}
