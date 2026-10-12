"use server";

import { revalidatePath } from "next/cache";
import { backendRequest, isBackendApiError } from "@/lib/api/backend.server";
import { requireAccessToken, requirePermission } from "@/lib/auth/dal.server";

export async function manageAccountAction(operation: "create" | "edit" | "status" | "activation", id: string, form: FormData) {
  await requirePermission("users.manage");
  const accessToken = await requireAccessToken();
  if (!["create", "edit", "status", "activation"].includes(operation)
    || (operation !== "create" && !/^[a-f\d]{24}$/i.test(id))) {
    return { ok: false, message: "Invalid account request." };
  }
  const fields = operation === "status" ? ["status", "reason", "version"]
    : operation === "activation" ? ["version"]
    : ["firstName", "lastName", "phone", "personnelId", "position", "organization", "role", "barangay",
      "utilityCompany", "repairOrganization", "repairTeam", "approvalAuthority", "approvalReference",
      ...(operation === "create" ? ["email"] : ["version"])];
  const body = Object.fromEntries(fields.map(field => [field, String(form.get(field) ?? "")]));
  if (body.role !== "repair_personnel") delete body.phone;
  const path = operation === "create" ? "/users/authorized" : `/users/authorized/${id}${operation === "edit" ? "" : `/${operation}`}`;
  try {
    const response = await backendRequest(path, {
      accessToken, method: operation === "edit" ? "PUT" : operation === "status" ? "PATCH" : "POST",
      body: JSON.stringify(body),
    });
    revalidatePath("/admin/users");
    return { ok: true, message: response.message ?? "Account updated." };
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) {
      const payload = error.payload as { errors?: Array<{ message?: string }> } | undefined;
      return { ok: false, message: payload?.errors?.[0]?.message || error.message };
    }
    return { ok: false, message: "The account service is unavailable. Refresh to check the account before retrying." };
  }
}
