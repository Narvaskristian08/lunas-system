import type { Metadata } from "next";
import { MilestoneUnavailable } from "@/components/states/milestone-unavailable";

export const metadata: Metadata = { title: "Notification details" };

export default function NotificationDetailPage() {
  return <MilestoneUnavailable title="Notifications are not available yet" description="Live notifications will be introduced with the later operational workflows they support." />;
}
