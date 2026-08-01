"use client";

import { useCallback, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { MobileNavigationDrawer } from "@/components/layout/mobile-navigation-drawer";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { cn } from "@/lib/utils";

export function ApplicationShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const { online, checked } = useConnectivity();
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const toggleCollapsed = () => {
    setCollapsed((current) => !current);
  };

  return (
    <div className="flex min-h-screen bg-[#f6f8fb]">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block", collapsed ? "w-[76px]" : "w-[272px]")} aria-label="Application sidebar"><Sidebar collapsed={collapsed} onToggle={toggleCollapsed} /></aside>
      <MobileNavigationDrawer open={drawerOpen} onClose={closeDrawer} triggerRef={menuButtonRef} />

      <div className={cn("flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200", collapsed ? "lg:ml-[76px]" : "lg:ml-[272px]")}>
        <div className="sticky top-0 z-30"><TopHeader onOpenNavigation={() => setDrawerOpen(true)} menuButtonRef={menuButtonRef} />{checked && !online ? <div className="flex min-h-10 items-center justify-center gap-2 bg-amber-100 px-4 py-2 text-center text-xs font-semibold text-amber-950" role="status"><WifiOff className="size-4 shrink-0" aria-hidden="true" /> Offline — live data and submissions are paused. Your unsaved form data is preserved.</div> : null}</div>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 xl:px-8 xl:py-7">{children}</main>
        <footer className="flex flex-col gap-1 border-t border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 Dagupan City Government · LUNAS v1.0.0-preview</p><p>Authorized government use only</p></footer>
      </div>
    </div>
  );
}
