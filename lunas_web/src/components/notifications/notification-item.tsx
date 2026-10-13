"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ClipboardList,
  Eye,
  FileWarning,
  Megaphone,
  ShieldAlert,
  Timer,
  Wrench,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { cn, formatDateTime, formatRelativeDate } from "@/lib/utils";
import type { LunasNotification, NotificationCategory, Severity } from "@/types";

const categoryIcons: Record<NotificationCategory, LucideIcon> = {
  Reports: FileWarning,
  "Work orders": ClipboardList,
  SLA: Timer,
  Repairs: Wrench,
  Security: ShieldAlert,
  System: Megaphone,
};

const iconTones: Record<Severity, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  information: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-slate-200 bg-slate-100 text-slate-600",
};

export function NotificationItem({
  notification,
  selected,
  onSelectedChange,
  onOpen,
}: {
  notification: LunasNotification;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onOpen: () => void;
}) {
  const Icon = categoryIcons[notification.category] ?? Bell;

  return (
    <article
      className={cn(
        "group relative grid grid-cols-[auto_1fr] gap-3 border-b border-slate-200 px-4 py-4 transition-colors last:border-b-0 sm:grid-cols-[auto_auto_1fr_auto] sm:items-start sm:gap-4 sm:px-5",
        notification.read ? "bg-white hover:bg-slate-50/80" : "bg-blue-50/45 hover:bg-blue-50/75",
      )}
    >
      {!notification.read ? (
        <span
          className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-brand-700"
          aria-hidden="true"
        />
      ) : null}

      <label className="mt-1 flex size-10 cursor-pointer items-center justify-center rounded-lg hover:bg-white/80">
        <span className="sr-only">Select {notification.title}</span>
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onSelectedChange(event.target.checked)}
          className="size-4.5 rounded border-slate-300 accent-brand-700"
        />
      </label>

      <span
        className={cn(
          "mt-1 hidden size-10 items-center justify-center rounded-xl border sm:flex",
          iconTones[notification.severity],
        )}
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          {!notification.read ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-800">
              <span className="size-2 rounded-full bg-brand-700" aria-hidden="true" />
              Unread
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-500">Read</span>
          )}
          <span className="text-xs text-slate-300" aria-hidden="true">•</span>
          <span className="text-xs font-semibold text-slate-600">{notification.category}</span>
          <StatusBadge tone={notification.severity} className="min-h-5 px-2 py-0 text-[11px]">
            {notification.severity.charAt(0).toUpperCase() + notification.severity.slice(1)}
          </StatusBadge>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mt-1.5 block max-w-full rounded-md text-left font-semibold leading-5 text-slate-950 hover:text-brand-700"
        >
          <span>{notification.title}</span>
        </button>
        <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-5 text-slate-600">
          {notification.message}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <time dateTime={notification.timestamp} title={formatDateTime(notification.timestamp)}>
            {formatRelativeDate(notification.timestamp)}
          </time>
          {notification.relatedRecord?.reference ? (
            <span className="mono font-semibold text-slate-600">
              {notification.relatedRecord.reference}
            </span>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="col-start-2 row-start-2 inline-flex min-h-10 items-center justify-center gap-1.5 self-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-800 sm:col-start-4 sm:row-start-1 sm:mt-1"
        aria-label={`Open notification: ${notification.title}`}
      >
        View details
        <Eye className="size-3.5" aria-hidden="true" />
      </button>
    </article>
  );
}
