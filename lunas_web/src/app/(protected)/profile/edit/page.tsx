import type { Metadata } from "next";
import { EditProfileForm } from "@/components/profile/edit-profile-form";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "Edit profile",
};

export default async function EditProfilePage() {
  await requirePermission("profile.manage");
  return <EditProfileForm />;
}
