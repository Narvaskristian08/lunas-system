"use client";

import { Menu, Search, ShieldCheck } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { useViewer } from "@/components/providers/viewer-provider";

export function TopHeader({ onOpenNavigation, menuButtonRef }: { onOpenNavigation: () => void; menuButtonRef: React.RefObject<HTMLButtonElement | null> }) {
  const viewer = useViewer();
  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button ref={menuButtonRef} type="button" onClick={onOpenNavigation} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu className="size-5" aria-hidden="true" /></button>
        <button type="button" className="hidden min-h-11 w-[min(34vw,430px)] items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-left text-sm text-slate-500 hover:border-slate-400 hover:bg-white md:flex" aria-label="Open global search"><Search className="size-4.5" aria-hidden="true" /><span className="truncate">Search incidents, reports, work orders…</span><kbd className="ml-auto rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Ctrl K</kbd></button>
        <div className="hidden items-center gap-2 xl:flex"><span className="h-6 w-px bg-slate-200" /><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><ShieldCheck className="size-3.5" aria-hidden="true" /> System healthy</span></div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <button type="button" className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Open global search"><Search className="size-5" aria-hidden="true" /></button>
        <UserMenu compact={viewer.role.length > 22} />
      </div>
    </header>
  );
}
