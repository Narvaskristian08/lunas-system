import { LunasBrand } from "@/components/ui/brand";

export default function AuthenticationLoading() {
  return (
    <main id="main-content" className="grid min-h-screen bg-slate-50 lg:grid-cols-[minmax(420px,0.92fr)_minmax(540px,1.08fr)]">
      <section className="hidden bg-brand-950 p-10 lg:block" aria-hidden="true">
        <LunasBrand inverse href="/login" />
        <div className="mt-[34vh] space-y-4">
          <div className="h-10 w-4/5 animate-pulse rounded-lg bg-white/10" />
          <div className="h-5 w-3/5 animate-pulse rounded bg-white/10" />
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[480px]" role="status" aria-label="Loading secure authentication page">
          <span className="sr-only">Loading secure authentication page…</span>
          <div className="mb-7 space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
            <div className="h-9 w-72 max-w-full animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </section>
    </main>
  );
}

