import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default async function EditProfilePage() {
  const viewer = await requirePermission("profile.manage");
  if (!["citizen", "repair_personnel"].includes(viewer.backendRole)) redirect("/profile");
  return <EditProfileForm />;
}
