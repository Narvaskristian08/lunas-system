import type { Metadata } from "next";
import { NotificationDetail } from "@/components/notifications/notification-detail";
import { requirePermission } from "@/lib/auth/dal.server";

export const metadata: Metadata = {
  title: "Notification details",
};

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("notifications.view");
  const { id } = await params;
  return <NotificationDetail id={id} />;
}
