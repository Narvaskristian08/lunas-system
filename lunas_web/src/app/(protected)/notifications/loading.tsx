import { SkeletonLine } from "@/components/states/loading";

export default function NotificationsLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading Notifications" className="space-y-6">
      <span className="sr-only">Loading Notifications</span>
      <div className="space-y-3" aria-hidden="true">
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-8 w-64" />
        <SkeletonLine className="w-[min(540px,90%)]" />
      </div>
      <div className="surface-card overflow-hidden rounded-2xl" aria-hidden="true">
        <div className="border-b border-slate-200 p-5"><SkeletonLine className="h-11 w-full" /></div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-4 border-b border-slate-200 px-5 py-5 last:border-0">
            <span className="skeleton size-4 rounded" />
            <span className="skeleton hidden size-10 rounded-xl sm:block" />
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonLine className="h-3 w-32" />
              <SkeletonLine className="h-4 w-[min(420px,85%)]" />
              <SkeletonLine className="h-3 w-[min(600px,95%)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
