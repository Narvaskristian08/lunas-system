"use client";

import { Menu, ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { NotificationHeaderLink } from "@/components/layout/notification-header-link";
import { UserMenu } from "@/components/layout/user-menu";
import { useViewer } from "@/components/providers/viewer-provider";

export function TopHeader({ onOpenNavigation, menuButtonRef }: { onOpenNavigation: () => void; menuButtonRef: React.RefObject<HTMLButtonElement | null> }) {
  const viewer = useViewer();
  return (
    <header className="flex h-18 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 sm:px-5 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button ref={menuButtonRef} type="button" onClick={onOpenNavigation} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open Navigation"><Menu className="size-5" aria-hidden="true" /></button>
        <div className="hidden items-center gap-2 xl:flex"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><ShieldCheck className="size-3.5" aria-hidden="true" /> System Healthy</span></div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationHeaderLink />
        <Suspense fallback={<div className="size-11" />}>
          <UserMenu compact={viewer.role.length > 22} />
        </Suspense>
      </div>
    </header>
  );
}
