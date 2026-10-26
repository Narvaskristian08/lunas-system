"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react";
import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationItem } from "@/components/notifications/notification-item";
import { NotificationDetailModal } from "@/components/notifications/notification-detail-modal";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState, OfflineState } from "@/components/states/system-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DateRangeFilter, FilterBar, FilterSelect, SortControl } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { listNotificationsAction, markAllNotificationsReadAction, markNotificationsReadAction } from "@/app/actions/notifications";
import type { LunasNotification, NotificationCategory } from "@/types";

const PAGE_SIZE = 5;


type LoadState = "loading" | "success" | "error" | "offline";

function NotificationListSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading Notifications">
      <span className="sr-only">Loading Notifications</span>
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

function NotificationsWorkspace({ initialNotificationId }: { initialNotificationId?: string }) {
  const { notify } = useToast();
  const requestId = useRef(0);
  const invalidateRequest = useCallback(() => { ++requestId.current; }, []);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [delayedQuery, setDelayedQuery] = useState("");
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
  const [revision, setRevision] = useState(0);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [openNotificationId, setOpenNotificationId] = useState(initialNotificationId ?? null);
  const reloadInbox = useCallback(() => {
    ++requestId.current;
    setLoadState("loading");
    setRevision((current) => current + 1);
  }, []);
  useEffect(() => { const timer = setTimeout(() => setDelayedQuery(query), 300); return () => clearTimeout(timer); }, [query]);


  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoadState("loading");
    try {
      const result = await listNotificationsAction({ page, limit: PAGE_SIZE, category, search: delayedQuery, readState, dateRange, sort });
      if (currentRequest !== requestId.current) return;
      setItems(result.items);
      setTotal(result.total);
      setUnread(result.unreadCount);
      setSelected(new Set());
      const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
      if (page > lastPage) { setPage(lastPage); return; }
      setRefreshedAt(new Date());
      setLoadState("success");
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setLoadState(error instanceof Error && error.message === "OFFLINE" ? "offline" : "error");
    }
  }, [page, category, delayedQuery, readState, dateRange, sort]);

  const retryLoad = () => {
    setLoadState("loading");
    void load();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => { window.clearTimeout(timer); invalidateRequest(); };
  }, [load, revision, invalidateRequest]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") reloadInbox();
    };
    const timer = window.setInterval(refreshIfVisible, 30_000);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [reloadInbox]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visiblePage = page;
  const visible = items;
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

  const handleMarkedRead = useCallback((id: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
    reloadInbox();
  }, [reloadInbox]);

  const closeNotification = () => {
    setOpenNotificationId(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("notification")) {
      url.searchParams.delete("notification");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  };

  const markRead = async (ids: string[], all = false) => {
    if ((!all && !ids.length) || saving) return;
    setSaving(true);
    try {
      if (all) await markAllNotificationsReadAction();
      else await markNotificationsReadAction(ids);
      const idSet = new Set(ids);
      setItems((current) => current.map((notification) => idSet.has(notification.id) ? { ...notification, read: true } : notification));
      reloadInbox();
      window.dispatchEvent(new Event("lunas-notifications-read"));
      setSelected(new Set());
      notify({
        title: all ? "All notifications marked as read" : `${ids.length} notification${ids.length === 1 ? "" : "s"} marked as read`,
        tone: "success",
      });
    } catch (error) {
      reloadInbox();
      notify({
        title: error instanceof Error && error.message === "OFFLINE" ? "You’re offline" : "Read status was not updated",
        message: "Some updates may have saved. Refresh the inbox before trying again.",
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
            : loadState === "error"
              ? "Your notification inbox could not be loaded. Try refreshing."
            : unread
              ? `${unread} unread notification${unread === 1 ? "" : "s"} need your attention.`
              : "You’re caught up. New operational alerts will appear here."}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Notifications" }]}
        actions={<>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void markRead(items.filter((item) => !item.read).map((item) => item.id), true)}
            disabled={unread === 0 || loadState !== "success"}
            loading={saving && selected.size === 0}
            loadingLabel="Updating…"
          >
            <CheckCheck className="size-4" aria-hidden="true" />
            Mark All as Read
          </Button>
          {hasFilters ? <Button variant="secondary" disabled={saving || !visible.some(item => !item.read)} onClick={() => void markRead(visible.filter(item => !item.read).map(item => item.id))}>Mark Visible as Read</Button> : null}
        </>}
      />

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <SearchInput
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              onClear={() => { setQuery(""); setPage(1); }}
              placeholder="Search title, message, or record ID"
              aria-label="Search Notifications"
              className="flex-1"
            />
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <Bell className="size-4 text-brand-700" aria-hidden="true" />
              <span><strong className="text-slate-950">{loadState === "success" ? total : "—"}</strong> matching</span>
              <span className="text-slate-300" aria-hidden="true">•</span>
              <span><strong className="text-brand-800">{loadState === "success" ? unread : "—"}</strong> unread</span>
            </div>
          </div>
        </div>

        <FilterBar activeCount={[category !== "all", readState !== "all", dateRange !== "all", sort !== "newest"].filter(Boolean).length}>
          <FilterSelect
            label="Notification Category"
            value={category}
            onChange={(event) => { setCategory(event.target.value as "all" | NotificationCategory); setPage(1); }}
            options={[
              { value: "all", label: "All Categories" },
              { value: "Reports", label: "Reports" },
              { value: "Work orders", label: "Work Orders" },
              { value: "SLA", label: "SLA" },
              { value: "Repairs", label: "Repairs" },
              { value: "Security", label: "Security" },
              { value: "System", label: "System" },
            ]}
          />
          <FilterSelect
            label="Read Status"
            value={readState}
            onChange={(event) => { setReadState(event.target.value); setPage(1); }}
            options={[
              { value: "all", label: "Read & Unread" },
              { value: "unread", label: "Unread Only" },
              { value: "read", label: "Read Only" },
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
                    Clear Selection
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => void markRead(Array.from(selected))}
                    loading={saving}
                    loadingLabel="Updating…"
                  >
                    <CheckCheck className="size-4" aria-hidden="true" /> Mark Selected as Read
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
                  <span className="text-xs text-slate-500">{total} result{total === 1 ? "" : "s"}</span>
                </div>
                <div aria-label="Notification List">
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
                      onOpen={() => setOpenNotificationId(notification.id)}
                    />
                  ))}
                </div>
                <Pagination page={visiblePage} pages={pages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
              </>
            ) : (
              <EmptyState
                icon={hasFilters ? "search" : "notifications"}
                title={hasFilters ? "No notifications match your filters" : "No notifications yet"}
                description={hasFilters ? "Try a broader search, another category, or reset the selected filters." : "Operational alerts, account notices, and work updates will appear here."}
                action={hasFilters ? { label: "Reset Filters", onClick: resetFilters } : undefined}
              />
            )}
          </>
        ) : null}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
        <p>{loadState === "success" && refreshedAt ? <>Last refreshed <time dateTime={refreshedAt.toISOString()}>{refreshedAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}</time></> : "Refresh to get the latest notifications."}</p>
        <Button type="button" variant="ghost" size="sm" className="min-h-10 shrink-0 px-2" disabled={loadState === "loading" || saving} onClick={retryLoad}>
          <RefreshCw className="size-3.5" aria-hidden="true" /> Refresh
        </Button>
      </div>

      {openNotificationId ? (
        <NotificationDetailModal
          key={openNotificationId}
          notificationId={openNotificationId}
          onClose={closeNotification}
          onMarkedRead={handleMarkedRead}
        />
      ) : null}
    </>
  );
}

export function NotificationsCenter({ initialNotificationId }: { initialNotificationId?: string }) {
  return (
    <PermissionGate permission="notifications.view" mode="denied">
      <NotificationsWorkspace initialNotificationId={initialNotificationId} />
    </PermissionGate>
  );
}
