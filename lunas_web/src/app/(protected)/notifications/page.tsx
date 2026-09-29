import type { Metadata } from "next";
import { NotificationsCenter } from "@/components/notifications/notifications-center";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <NotificationsCenter />;
}
