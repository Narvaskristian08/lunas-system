"use server";

import { revalidatePath } from "next/cache";
import { BackendApiError, backendRequest, isBackendApiError } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

export type RepairPersonnelActionResult = { ok: boolean; message: string };

const fields = ["firstName", "lastName", "email", "phone", "repairTeam", "repairAccountType"] as const;

export async function createRepairPersonnelAction(form: FormData): Promise<RepairPersonnelActionResult> {
  const viewer = await requirePermission("personnel.manage");
  if (viewer.backendRole !== "utility_provider") {
    return { ok: false, message: "Only Utility Providers can add Repair Personnel." };
  }
  const accessToken = await requireAccessToken();
  const body = Object.fromEntries(fields.map((field) => [field, String(form.get(field) ?? "").trim()]));

  try {
    const response = await backendRequest("/users/repair-personnel", {
      method: "POST",
      accessToken,
      body: JSON.stringify(body),
    });
    revalidatePath("/repair-personnel");
    revalidatePath("/work-orders");
    revalidatePath("/dashboard");
    return { ok: true, message: response.message ?? "Repair Personnel account created." };
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) {
      const payload = error.payload as { errors?: Array<{ message?: string }> } | undefined;
      return { ok: false, message: payload?.errors?.[0]?.message || error.message };
    }
    if (error instanceof BackendApiError) return { ok: false, message: "The account service is unavailable. Refresh and try again." };
    return { ok: false, message: "The account service is unavailable. Refresh and try again." };
  }
}
