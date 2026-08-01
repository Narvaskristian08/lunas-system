"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Landmark, X } from "lucide-react";
import { LunasBrand } from "@/components/ui/brand";
import { RoleBadge } from "@/components/ui/badge";
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
  return (
    <div className="flex h-full flex-col bg-[#082b4c] text-white">
      <div className={cn("flex h-[72px] shrink-0 items-center border-b border-white/10", collapsed ? "justify-center px-3" : "justify-between px-5")}>
        <LunasBrand compact={collapsed} inverse className="min-w-0" />
        {mobile ? (
          <button type="button" onClick={onClose} className="flex size-11 items-center justify-center rounded-xl text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Close navigation"><X className="size-5" aria-hidden="true" /></button>
        ) : null}
      </div>

      <div className={cn("border-b border-white/10", collapsed ? "px-2 py-4" : "px-4 py-4")}>
        <div className={cn("rounded-xl bg-white/[0.07]", collapsed ? "flex justify-center p-2" : "p-3")}>
          {collapsed ? <RoleBadge role={viewer.role} compact /> : <><p className="truncate text-sm font-semibold text-white">{viewer.firstName} {viewer.lastName}</p><p className="mt-0.5 truncate text-xs text-blue-200">{viewer.organization}</p><div className="mt-2"><RoleBadge role={viewer.role} /></div></>}
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Primary navigation">
        {navigationGroups.map((group) => {
          const items = group.items.filter((item) => !item.permission || hasPermission(viewer, item.permission));
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-5 last:mb-0">
              {!collapsed ? <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-300/80">{group.label}</p> : <span className="mx-auto mb-2 block h-px w-7 bg-white/15" />}
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
                          "group flex min-h-11 items-center rounded-xl text-sm font-medium transition-colors",
                          collapsed ? "justify-center px-2" : "gap-3 px-3",
                          active ? "bg-white text-[#082b4c] shadow-sm" : "text-blue-100 hover:bg-white/10 hover:text-white",
                        )}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className="size-[19px] shrink-0" aria-hidden="true" />
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

      <div className={cn("shrink-0 border-t border-white/10", collapsed ? "p-3" : "p-4")}>
        {!collapsed ? <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5"><Landmark className="size-5 shrink-0 text-blue-200" aria-hidden="true" /><div className="min-w-0"><p className="text-xs font-semibold">Dagupan City</p><p className="truncate text-[11px] text-blue-200">Government operations</p></div></div> : null}
        {!mobile ? <button type="button" onClick={onToggle} className={cn("flex min-h-10 w-full items-center rounded-xl text-xs font-semibold text-blue-100 hover:bg-white/10 hover:text-white", collapsed ? "justify-center" : "gap-2 px-3")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <><ChevronLeft className="size-4" aria-hidden="true" /> Collapse navigation</>}</button> : null}
      </div>
    </div>
  );
}
