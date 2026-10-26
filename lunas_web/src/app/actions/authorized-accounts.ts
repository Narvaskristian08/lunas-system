"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createTanodAction(form: FormData): Promise<void> {
  const viewer = await requirePermission("reports.validate");
  if (viewer.backendRole !== "barangay_official" || !viewer.barangay) redirect("/validation-routing/tanods?error=Only%20Barangay%20Infrastructure%20Committee%20members%20can%20create%20Committee%20Staff%20accounts.");
  const accessToken = await requireAccessToken();
  const body = { firstName: String(form.get("firstName") ?? "").trim(), lastName: String(form.get("lastName") ?? "").trim(), middleName: String(form.get("middleName") ?? "").trim(), suffix: String(form.get("suffix") ?? "").trim(), email: String(form.get("email") ?? "").trim(), phone: String(form.get("phone") ?? "").trim(), role: "utility_personnel", barangay: viewer.barangay, organization: `Barangay ${viewer.barangay}`, position: "Barangay Committee Staff / Utility Personnel", approvalAuthority: `${viewer.firstName} ${viewer.lastName}`, approvalReference: `Created by Barangay Infrastructure Committee: ${viewer.barangay}` };
  try {
    const response = await backendRequest<{ data?: { delivery?: { delivered?: boolean } } }>("/users/tanods", { accessToken, method: "POST", body: JSON.stringify(body) });
    revalidatePath("/validation-routing/tanods"); revalidatePath("/validation-routing");
    const warning = response.data?.data?.delivery?.delivered === false;
    revalidatePath("/validation-routing/tanods");
    redirect(`/validation-routing/tanods?created=1${warning ? "&warning=1" : ""}`);
  } catch (error) {
    if (isBackendApiError(error) && error.status < 500) { const payload = error.payload as { errors?: Array<{ message?: string }> } | undefined; redirect(`/validation-routing/tanods?error=${encodeURIComponent(payload?.errors?.[0]?.message || error.message)}`); }
    redirect("/validation-routing/tanods?error=The%20account%20service%20is%20unavailable.%20Try%20again%20later.");
  }
}
