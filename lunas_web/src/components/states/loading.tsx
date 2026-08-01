import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ label = "Loading", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "size-4", md: "size-6", lg: "size-9" };
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <LoaderCircle className={cn("animate-spin text-brand-700", sizes[size])} aria-hidden="true" />
      <span className={size === "sm" ? "text-xs" : "text-sm"}>{label}</span>
    </span>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <span className={cn("skeleton block h-3 rounded", className)} aria-hidden="true" />;
}

export function SkeletonCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="surface-card rounded-2xl p-5" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonLine className="w-32" />
          <SkeletonLine className={compact ? "h-6 w-20" : "h-8 w-24"} />
        </div>
        <span className="skeleton size-11 rounded-xl" />
      </div>
      {!compact ? <SkeletonLine className="mt-4 w-40" /> : null}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="surface-card overflow-hidden rounded-2xl" aria-hidden="true">
      <div className="flex gap-8 border-b border-slate-200 bg-slate-50 px-5 py-4">
        {["w-24", "w-32", "w-28", "w-20"].map((width, index) => <SkeletonLine key={index} className={width} />)}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid grid-cols-4 gap-8 border-b border-slate-100 px-5 py-5 last:border-0">
          <SkeletonLine className="w-28" />
          <SkeletonLine className="w-36" />
          <SkeletonLine className="w-24" />
          <SkeletonLine className="w-20" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard" className="space-y-6">
      <span className="sr-only">Loading dashboard</span>
      <div className="space-y-3" aria-hidden="true"><SkeletonLine className="h-7 w-72" /><SkeletonLine className="w-[420px] max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}</div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]"><SkeletonTable rows={4} /><div className="surface-card rounded-2xl p-5"><SkeletonLine className="h-5 w-40" />{Array.from({ length: 5 }).map((_, index) => <SkeletonLine key={index} className="mt-5 h-10 w-full" />)}</div></div>
    </div>
  );
}

export function FullPageLoading({ label = "Preparing LUNAS…" }: { label?: string }) {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center"><LoadingSpinner label={label} size="lg" /><p className="mt-3 text-sm text-slate-500">Securely loading your workspace.</p></div>
    </main>
  );
}

export function AuthenticationLoading() {
  return <FullPageLoading label="Checking your secure session…" />;
}

export function RouteLoading({ label = "Loading page…" }: { label?: string }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center" role="status">
      <div className="text-center"><LoadingSpinner label={label} size="lg" /><p className="mt-3 text-sm text-slate-500">You can continue using navigation while this page loads.</p></div>
    </div>
  );
}

export function InlineFieldLoading({ label = "Checking…" }: { label?: string }) {
  return (
    <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-slate-500" role="status">
      <LoaderCircle className="size-3.5 animate-spin text-brand-700" aria-hidden="true" />{label}
    </span>
  );
}

export function MapSkeleton() {
  return <div className="skeleton flex min-h-64 items-center justify-center rounded-xl" role="status"><span className="relative z-10 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-slate-600">Loading map layers…</span></div>;
}

export function ImageSkeleton({ label = "Loading image" }: { label?: string }) {
  return <div className="skeleton aspect-video rounded-xl" role="status"><span className="sr-only">{label}</span></div>;
}
