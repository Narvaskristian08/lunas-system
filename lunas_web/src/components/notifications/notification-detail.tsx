"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationDetailPanel } from "@/components/notifications/notification-detail-panel";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/states/empty-state";
import { SkeletonCard, SkeletonLine } from "@/components/states/loading";
import { ErrorState, OfflineState } from "@/components/states/system-state";
import { buttonStyles } from "@/components/ui/button";
import { getNotificationAction, markNotificationsReadAction } from "@/app/actions/notifications";
import type { LunasNotification } from "@/types";

type DetailState = "loading" | "ready" | "missing" | "offline" | "error";

function DetailSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-label="Loading Notification Details">
      <span className="sr-only">Loading Notification Details</span>
      <div className="space-y-3" aria-hidden="true">
        <SkeletonLine className="h-3 w-32" />
        <SkeletonLine className="h-8 w-[min(620px,90%)]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]" aria-hidden="true">
        <div className="surface-card min-h-96 rounded-2xl p-6">
          <SkeletonLine className="h-5 w-40" />
          <SkeletonLine className="mt-6 h-4 w-full" />
          <SkeletonLine className="mt-3 h-4 w-[92%]" />
          <SkeletonLine className="mt-3 h-4 w-[78%]" />
        </div>
        <div className="space-y-5"><SkeletonCard /><SkeletonCard compact /></div>
      </div>
    </div>
  );
}

function NotificationDetailWorkspace({ id }: { id: string }) {
  const { notify } = useToast();
  const [notification, setNotification] = useState<LunasNotification | null>(null);
  const [state, setState] = useState<DetailState>("loading");

  const load = useCallback(async () => {
    try {
      const result = await getNotificationAction(id);
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
        } catch (error) {
          notify({
            title: "Read status could not be saved",
            message: error instanceof Error && error.message === "OFFLINE" ? "Reconnect to sync this notification." : "The notification remains unread. You can try again later.",
            tone: "warning",
          });
        }
      }
    } catch (error) {
      setNotification(null);
      setState(error instanceof Error && error.message === "OFFLINE" ? "offline" : "error");
    }
  }, [id, notify]);

  const retryLoad = () => {
    setState("loading");
    void load();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (state === "loading") return <DetailSkeleton />;
  if (state === "offline") return <OfflineState fullPage onRetry={retryLoad} />;
  if (state === "error") return <ErrorState fullPage variant="data" onRetry={retryLoad} />;
  if (state === "missing") {
    return (
      <div className="surface-card rounded-2xl">
        <EmptyState
          icon="notifications"
          size="page"
          title="Notification not found"
          description="This notification may have expired, been removed under retention rules, or the link may be incorrect."
          action={{ label: "Return to Notifications", href: "/notifications" }}
        />
      </div>
    );
  }
  if (!notification) return null;

  return (
    <>
      <PageHeader
        title="Notification Details"
        description={`Notification ${notification.id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Notifications", href: "/notifications" },
          { label: notification.id },
        ]}
        actions={
          <Link href="/notifications" className={buttonStyles({ variant: "secondary" })}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to Notifications
          </Link>
        }
      />
      <NotificationDetailPanel notification={notification} />
    </>
  );
}

export function NotificationDetail({ id }: { id: string }) {
  return (
    <PermissionGate permission="notifications.view" mode="denied">
      <NotificationDetailWorkspace id={id} />
    </PermissionGate>
  );
}
