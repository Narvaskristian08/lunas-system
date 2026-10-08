import { SkeletonCard, SkeletonLine } from "@/components/states/loading";

export default function ProfileLoading() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading Profile" className="space-y-6">
      <span className="sr-only">Loading Profile</span>
      <div className="space-y-3" aria-hidden="true">
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-8 w-56" />
        <SkeletonLine className="w-[min(520px,90%)]" />
      </div>
      <div className="surface-card overflow-hidden rounded-2xl" aria-hidden="true">
        <div className="skeleton h-28" />
        <div className="flex items-end gap-4 px-6 pb-6">
          <span className="skeleton -mt-10 size-24 shrink-0 rounded-full ring-4 ring-white" />
          <div className="min-w-0 flex-1 space-y-3"><SkeletonLine className="h-6 w-56" /><SkeletonLine className="w-40" /></div>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]" aria-hidden="true">
        <div className="surface-card rounded-2xl p-5"><SkeletonLine className="h-5 w-44" />{Array.from({ length: 6 }).map((_, index) => <SkeletonLine key={index} className="mt-5 h-9 w-full" />)}</div>
        <div className="space-y-5"><SkeletonCard /><SkeletonCard /></div>
      </div>
    </div>
  );
}
