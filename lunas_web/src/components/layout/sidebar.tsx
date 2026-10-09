"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Landmark, X } from "lucide-react";
import { LunasBrand } from "@/components/ui/brand";
import { useViewer } from "@/components/providers/viewer-provider";
import { navigationGroups } from "@/components/layout/navigation-config";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function Sidebar({
  collapsed,
  mobile = false,
  onToggle,
  onNavigate,
  onClose,
}: {
  collapsed: boolean;
  mobile?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const viewer = useViewer();
  const pathname = usePathname();
  const scopeLabel = viewer.backendRole === "barangay_official" && viewer.barangay
    ? `Barangay ${viewer.barangay}`
    : "Dagupan City";
  return (
    <div className="flex h-full flex-col bg-brand-950 text-white">
      <div className={cn("flex h-18 shrink-0 items-center", collapsed ? "justify-center px-3" : "justify-between px-6")}>
        <LunasBrand compact={collapsed} inverse subtitle="Command Center" className="min-w-0" />
        {mobile ? (
          <button type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-xl text-slate-300 hover:bg-white/8 hover:text-white" aria-label="Close Navigation"><X className="size-5" aria-hidden="true" /></button>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-2" aria-label="Primary Navigation">
        {navigationGroups.map((group) => {
          const items = group.items.filter((item) =>
            !item.hiddenForRoles?.includes(viewer.backendRole) &&
            (!item.visibleForRoles || item.visibleForRoles.includes(viewer.backendRole)) &&
            (!item.permission || hasPermission(viewer, item.permission))
          );
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-6 last:mb-0">
              {!collapsed ? <p className="mb-2 px-3 text-xs font-semibold leading-5 text-slate-300">{group.label}</p> : <span className="mx-auto mb-2 block h-px w-7 bg-white/15" />}
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname === item.href.split("?")[0] && item.href !== "/dashboard?module=reports" && !item.href.startsWith("/dashboard?");
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex min-h-11 items-center rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300",
                          collapsed ? "justify-center px-2" : "gap-3 px-3",
                          active ? "bg-brand-700 font-semibold text-white" : "text-slate-300 hover:bg-white/8 hover:text-white",
                        )}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        {!collapsed ? <span className="truncate">{item.label}</span> : <span className="sr-only">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={cn("shrink-0 border-t border-white/10", collapsed ? "p-3" : "px-4 py-3")}>
        <div className="mb-3">
        <div className={cn("flex items-center rounded-xl border border-white/10 bg-white/6", collapsed ? "justify-center p-3" : "gap-3 px-3 py-3")}>
          <Landmark className="size-5 shrink-0 text-blue-200" aria-hidden="true" />
          {!collapsed ? <div className="min-w-0">
            <p className="text-sm font-semibold leading-5 wrap-break-word" title={scopeLabel}>{scopeLabel}</p>
            <p className="mt-0.5 text-xs leading-4 text-slate-300">Government Operations</p>
          </div> : null}
        </div>
      </div>

        {!mobile ? <button type="button" onClick={onToggle} className={cn("flex min-h-10 w-full items-center rounded-lg text-xs font-medium text-slate-300 hover:bg-white/8 hover:text-white", collapsed ? "justify-center" : "gap-2 px-3")} aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}>{collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <><ChevronLeft className="size-4" aria-hidden="true" /> Collapse Sidebar</>}</button> : null}
      </div>
    </div>
  );
}
