"use client";

import { useCallback, useEffect, useState } from "react";
import { getNotificationAction, markNotificationsReadAction } from "@/app/actions/notifications";
import { NotificationDetailPanel } from "@/components/notifications/notification-detail-panel";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/states/empty-state";
import { SkeletonLine } from "@/components/states/loading";
import { ErrorState, OfflineState } from "@/components/states/system-state";
import { Modal } from "@/components/ui/modal";
import type { LunasNotification } from "@/types";

type DetailState = "loading" | "ready" | "missing" | "offline" | "error";

function DetailSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-label="Loading notification details">
      <span className="sr-only">Loading notification details</span>
      <div className="rounded-2xl border border-slate-200 p-5 sm:p-6" aria-hidden="true">
        <SkeletonLine className="h-5 w-40" />
        <SkeletonLine className="mt-6 h-6 w-[min(520px,85%)]" />
        <SkeletonLine className="mt-5 h-4 w-full" />
        <SkeletonLine className="mt-3 h-4 w-[88%]" />
        <SkeletonLine className="mt-8 h-14 w-full" />
      </div>
    </div>
  );
}

export function NotificationDetailModal({
  notificationId,
  onClose,
  onMarkedRead,
}: {
  notificationId: string;
  onClose: () => void;
  onMarkedRead: (id: string) => void;
}) {
  const { notify } = useToast();
  const [notification, setNotification] = useState<LunasNotification | null>(null);
  const [state, setState] = useState<DetailState>("loading");

  const load = useCallback(async () => {
    try {
      const result = await getNotificationAction(notificationId);
      if (!result) {
        setNotification(null);
        setState("missing");
        return;
      }

      let next = result;
      setNotification(next);
      setState("ready");
      if (!next.read) {
        try {
          await markNotificationsReadAction([next.id]);
          next = { ...next, read: true };
          setNotification(next);
          onMarkedRead(next.id);
          window.dispatchEvent(new Event("lunas-notifications-read"));
        } catch (error) {
          notify({
            title: "Read status could not be saved",
            message: error instanceof Error && error.message === "OFFLINE"
              ? "Reconnect to sync this notification."
              : "The notification remains unread. You can try again later.",
            tone: "warning",
          });
        }
      }
    } catch (error) {
      setNotification(null);
      setState(error instanceof Error && error.message === "OFFLINE" ? "offline" : "error");
    }
  }, [notificationId, notify, onMarkedRead]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const retry = () => {
    setState("loading");
    void load();
  };

  return (
    <Modal open title="Notification Details" onClose={onClose}>
      {state === "loading" ? <DetailSkeleton /> : null}
      {state === "offline" ? <OfflineState onRetry={retry} /> : null}
      {state === "error" ? <ErrorState variant="data" onRetry={retry} /> : null}
      {state === "missing" ? (
        <EmptyState
          icon="notifications"
          title="Notification not found"
          description="This notification may have expired, been removed under retention rules, or is no longer available."
        />
      ) : null}
      {state === "ready" && notification ? (
        <div className="space-y-4">
          <p className="mono break-all text-xs font-medium text-slate-500">
            Notification {notification.id}
          </p>
          <NotificationDetailPanel notification={notification} />
        </div>
      ) : null}
    </Modal>
  );
}
