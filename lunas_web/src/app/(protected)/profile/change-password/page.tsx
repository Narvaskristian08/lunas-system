import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "Change password",
};

export default async function ChangePasswordPage() {
  const viewer = await requirePermission("profile.manage");
  redirect(`${viewer.backendRole === "admin" ? "/admin/users" : "/dashboard"}?profile=password`);
}
