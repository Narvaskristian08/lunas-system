import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Link2,
  LockKeyhole,
  Radio,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { LunasNotification } from "@/types";

export function NotificationDetailPanel({ notification }: { notification: LunasNotification }) {
  const related = notification.relatedRecord;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.65fr)]">
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={notification.severity}>
              {notification.severity === "information" ? "Information" : notification.severity}
            </StatusBadge>
            <StatusBadge tone={notification.read ? "neutral" : "information"}>
              {notification.read ? "Read" : "Unread"}
            </StatusBadge>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-6 sm:py-7">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">
            {notification.category}
          </p>
          <h2 className="mt-2 text-balance text-xl font-bold leading-8 text-slate-950 sm:text-2xl">
            {notification.title}
          </h2>
          <p className="mt-5 max-w-3xl whitespace-pre-line text-[15px] leading-7 text-slate-700">
            {notification.fullMessage}
          </p>

          <dl className="mt-7 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarClock className="size-4" aria-hidden="true" /> Received
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-800">
                <time dateTime={notification.timestamp}>{formatDateTime(notification.timestamp)}</time>
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <Radio className="size-4" aria-hidden="true" /> Source
              </dt>
              <dd className="mt-1.5 text-sm font-medium text-slate-800">{notification.source}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Link2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-950">Related record</h2>
              {related ? (
                <p className="mono mt-1 break-all text-sm font-semibold text-slate-700">{related.id}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-600">No operational record is linked to this notice.</p>
              )}
            </div>
          </div>

          {related?.restricted || related?.available === false ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
              <div className="flex gap-2.5">
                <LockKeyhole className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Related content is restricted</p>
                  <p className="mt-1 leading-5 text-amber-900">
                    This record is unavailable to your current account. No protected record details are shown here.
                  </p>
                </div>
              </div>
            </div>
          ) : related?.href ? (
            <Link href={related.href} className={buttonStyles({ variant: "primary", className: "mt-5 w-full" })}>
              {related.label}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          ) : null}
        </Card>

        <Card className="p-5">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h2 className="font-semibold text-slate-950">Notification status</h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {notification.read
                  ? "This notification has been marked as read."
                  : "This notification will be marked as read when the service confirms the update."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
