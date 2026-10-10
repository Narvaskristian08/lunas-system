"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { listNotificationsAction } from "@/app/actions/notifications";
import { useViewer } from "@/components/providers/viewer-provider";

export function NotificationHeaderLink() {
  const viewer = useViewer();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!viewer.permissions.includes("notifications.view")) return;
    let active = true;
    listNotificationsAction()
      .then((notifications) => {
        if (active) setUnread(notifications.filter((notification) => !notification.read).length);
      })
      .catch(() => {
        if (active) setUnread(0);
      });
    return () => { active = false; };
  }, [viewer.permissions]);

  if (!viewer.permissions.includes("notifications.view")) return null;
  const label = unread > 0 ? `Notifications, ${unread} unread` : "Notifications";

  return (
    <Link href="/notifications" className="relative flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-brand-700" aria-label={label} title="Notifications">
      <Bell className="size-5" aria-hidden="true" />
      {unread > 0 ? <span className="absolute right-1 top-1 flex min-w-4.5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-4 text-white" aria-hidden="true">{unread > 99 ? "99+" : unread}</span> : null}
    </Link>
  );
}
