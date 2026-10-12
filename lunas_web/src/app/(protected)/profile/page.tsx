import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "My profile",
  description: "Review your LUNAS account, organization, and permissions.",
};

export default async function ProfilePage() {
  const viewer = await requirePermission("profile.manage");
  redirect(`${viewer.backendRole === "admin" ? "/admin/users" : "/dashboard"}?profile=1`);
}
