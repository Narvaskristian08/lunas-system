import type { Metadata } from "next";
import { NotificationsCenter } from "@/components/notifications/notifications-center";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ notification?: string }> }) {
  const { notification } = await searchParams;
  return <NotificationsCenter initialNotificationId={notification} />;
}
