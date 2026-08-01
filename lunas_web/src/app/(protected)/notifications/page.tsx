import type { Metadata } from "next";
import { NotificationsCenter } from "@/components/notifications/notifications-center";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Review operational alerts and account notifications in LUNAS.",
};

export default async function NotificationsPage() {
  await requirePermission("notifications.view");
  return <NotificationsCenter />;
}
