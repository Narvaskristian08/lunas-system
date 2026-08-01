import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/profile/change-password-form";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "Change password",
};

export default async function ChangePasswordPage() {
  await requirePermission("profile.manage");
  return <ChangePasswordForm />;
}
