"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, CircleAlert, RefreshCw, X } from "lucide-react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState, OfflineState } from "@/components/states/system-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangeFilter, FilterBar, FilterSelect, SortControl } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { notificationService } from "@/lib/mock-api";
import type { LunasNotification, NotificationCategory, Severity } from "@/types";

const PAGE_SIZE = 5;
const NOW = new Date("2026-08-01T10:30:00+08:00").getTime();

type LoadState = "loading" | "success" | "error" | "offline";

const priority: Record<Severity, number> = {
  critical: 5,
  warning: 4,
  information: 3,
  success: 2,
  neutral: 1,
};

function NotificationListSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading notifications">
      <span className="sr-only">Loading notifications</span>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4 border-b border-slate-200 px-5 py-5 last:border-0" aria-hidden="true">
          <span className="skeleton size-4 rounded" />
          <span className="skeleton hidden size-10 rounded-xl sm:block" />
          <div className="min-w-0 flex-1 space-y-3">
            <span className="skeleton block h-3 w-32 rounded" />
            <span className="skeleton block h-4 w-[min(420px,85%)] rounded" />
            <span className="skeleton block h-3 w-[min(600px,95%)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsWorkspace() {
  const { notify } = useToast();
  const [items, setItems] = useState<LunasNotification[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");
  const [readState, setReadState] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await notificationService.list();
      setItems(result.data);
      setSelected(new Set());
      setLoadState("success");
    } catch (error) {
      setLoadState(error instanceof Error && error.message === "OFFLINE" ? "offline" : "error");
    }
  }, []);

  const retryLoad = () => {
    setLoadState("loading");
    void load();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const result = items.filter((notification) => {
      const searchable = [
        notification.title,
        notification.message,
        notification.category,
        notification.relatedRecord?.id ?? "",
      ].join(" ").toLocaleLowerCase();
      if (normalized && !searchable.includes(normalized)) return false;
      if (category !== "all" && notification.category !== category) return false;
      if (readState === "unread" && notification.read) return false;
      if (readState === "read" && !notification.read) return false;
      if (dateRange !== "all") {
        const age = NOW - new Date(notification.timestamp).getTime();
        const maxAge = dateRange === "today" ? 24 * 60 * 60 * 1_000 : dateRange === "week" ? 7 * 24 * 60 * 60 * 1_000 : 30 * 24 * 60 * 60 * 1_000;
        if (age < 0 || age > maxAge) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      if (sort === "oldest") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sort === "priority") {
        return priority[b.severity] - priority[a.severity] || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [category, dateRange, items, query, readState, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePage = Math.min(page, pages);
  const visible = filtered.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE);
  const unread = items.filter((notification) => !notification.read).length;
  const allVisibleSelected = visible.length > 0 && visible.every((notification) => selected.has(notification.id));
  const hasFilters = Boolean(query.trim()) || category !== "all" || readState !== "all" || dateRange !== "all";

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setReadState("all");
    setDateRange("all");
    setSort("newest");
    setPage(1);
  };

  const markRead = async (ids: string[], all = false) => {
    if (!ids.length || saving) return;
    setSaving(true);
    try {
      if (all) await notificationService.markAllRead();
      else await notificationService.markRead(ids);
      const idSet = new Set(ids);
      setItems((current) => current.map((notification) => idSet.has(notification.id) ? { ...notification, read: true } : notification));
      setSelected(new Set());
      notify({
        title: all ? "All notifications marked as read" : `${ids.length} notification${ids.length === 1 ? "" : "s"} marked as read`,
        tone: "success",
      });
    } catch (error) {
      notify({
        title: error instanceof Error && error.message === "OFFLINE" ? "You’re offline" : "Read status was not updated",
        message: "Your notification list has not been changed. Reconnect or try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        eyebrow="Shared inbox"
        description={loadState === "loading"
          ? "Loading your latest operational and account alerts…"
          : loadState === "offline"
            ? "Reconnect to refresh your notification inbox."
            : unread
              ? `${unread} unread notification${unread === 1 ? "" : "s"} need your attention.`
              : "You’re caught up. New operational alerts will appear here."}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => void markRead(items.filter((item) => !item.read).map((item) => item.id), true)}
            disabled={unread === 0 || loadState !== "success"}
            loading={saving && selected.size === 0}
            loadingLabel="Updating…"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Mark all as read
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              onClear={() => { setQuery(""); setPage(1); }}
              placeholder="Search title, message, or record ID"
              aria-label="Search notifications"
              className="flex-1"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <Bell className="size-4 text-brand-700" aria-hidden="true" />
              <span><strong className="text-slate-950">{items.length}</strong> total</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span><strong className="text-brand-800">{unread}</strong> unread</span>
            </div>
          </div>
        </div>

        <FilterBar>
          <FilterSelect
            label="Notification category"
            value={category}
            onChange={(event) => { setCategory(event.target.value as "all" | NotificationCategory); setPage(1); }}
            options={[
              { value: "all", label: "All categories" },
              { value: "Reports", label: "Reports" },
              { value: "Work orders", label: "Work orders" },
              { value: "SLA", label: "SLA" },
              { value: "Repairs", label: "Repairs" },
              { value: "Security", label: "Security" },
              { value: "System", label: "System" },
            ]}
          />
          <FilterSelect
            label="Read status"
            value={readState}
            onChange={(event) => { setReadState(event.target.value); setPage(1); }}
            options={[
              { value: "all", label: "Read & unread" },
              { value: "unread", label: "Unread only" },
              { value: "read", label: "Read only" },
            ]}
          />
          <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
          <SortControl value={sort} onChange={(value) => { setSort(value); setPage(1); }} />
          {hasFilters ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
              <X className="size-4" aria-hidden="true" /> Reset
            </Button>
          ) : null}
        </FilterBar>

        {loadState === "loading" ? <NotificationListSkeleton /> : null}
        {loadState === "offline" ? <OfflineState onRetry={retryLoad} /> : null}
        {loadState === "error" ? <ErrorState variant="data" onRetry={retryLoad} /> : null}

        {loadState === "success" ? (
          <>
            {selected.size > 0 ? (
              <div className="flex flex-col gap-3 border-b border-brand-200 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" role="status">
                <p className="text-sm font-semibold text-brand-900">
                  {selected.size} notification{selected.size === 1 ? "" : "s"} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                    Clear selection
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void markRead(Array.from(selected))}
                    loading={saving}
                    loadingLabel="Updating…"
                  >
                    <CheckCheck className="size-4" aria-hidden="true" /> Mark selected as read
                  </Button>
                </div>
              </div>
            ) : null}

            {visible.length ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 sm:px-5">
                  <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={(event) => {
                        setSelected((current) => {
                          const next = new Set(current);
                          visible.forEach((notification) => event.target.checked ? next.add(notification.id) : next.delete(notification.id));
                          return next;
                        });
                      }}
                      className="size-4.5 rounded border-slate-300 accent-brand-700"
                    />
                    Select this page
                  </label>
                  <span className="text-xs text-slate-500">{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
                </div>
                <div aria-label="Notification list">
                  {visible.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      selected={selected.has(notification.id)}
                      onSelectedChange={(checked) => {
                        setSelected((current) => {
                          const next = new Set(current);
                          if (checked) next.add(notification.id);
                          else next.delete(notification.id);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
                <Pagination page={visiblePage} pages={pages} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </>
            ) : (
              <EmptyState
                icon={hasFilters ? "search" : "notifications"}
                title={hasFilters ? "No notifications match your filters" : "No notifications yet"}
                description={hasFilters ? "Try a broader search, another category, or reset the selected filters." : "Operational alerts, account notices, and work updates will appear here."}
                action={hasFilters ? { label: "Reset filters", onClick: resetFilters } : undefined}
              />
            )}
          </>
        ) : null}
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
        Deletion and archiving are not available in the current notification service integration.
        <Button type="button" variant="ghost" size="sm" className="ml-auto hidden min-h-8 shrink-0 px-2 sm:inline-flex" onClick={retryLoad}>
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </Button>
      </div>
    </>
  );
}

export function NotificationsCenter() {
  return (
    <PermissionGate permission="notifications.view" mode="denied">
      <NotificationsWorkspace />
    </PermissionGate>
  );
}
