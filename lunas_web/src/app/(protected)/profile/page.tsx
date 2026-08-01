import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "My profile",
  description: "Review your LUNAS account, organization, and permissions.",
};

export default async function ProfilePage() {
  await requirePermission("profile.manage");
  return <ProfileView />;
}
