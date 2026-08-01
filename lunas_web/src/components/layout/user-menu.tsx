"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, HelpCircle, KeyRound, LogOut, RefreshCw, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useViewer } from "@/components/providers/viewer-provider";
import { useToast } from "@/components/providers/toast-provider";
import { logoutAction, switchDemoRoleAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const roles: UserRole[] = [
  "Barangay Official",
  "City Engineering Office",
  "Utility Provider",
  "System Administrator",
  "Maintenance Coordinator",
  "Executive Viewer",
];

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const viewer = useViewer();
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [switching, startSwitch] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logoutAction();
    router.replace("/login?signedOut=1");
    router.refresh();
  };

  const switchRole = (role: UserRole) => {
    startSwitch(async () => {
      await switchDemoRoleAction(role);
      setOpen(false);
      notify({ title: `Previewing ${role}`, message: "Navigation and dashboard data now reflect this role.", tone: "info" });
      router.refresh();
    });
  };

  return (
    <>
      <div className="relative" ref={wrapperRef}>
        <button type="button" onClick={() => setOpen((current) => !current)} className="flex min-h-11 max-w-[260px] items-center gap-2 rounded-xl p-1.5 pr-2 text-left hover:bg-slate-100" aria-expanded={open} aria-haspopup="menu">
          <Avatar firstName={viewer.firstName} lastName={viewer.lastName} />
          {!compact ? <span className="hidden min-w-0 lg:block"><span className="block truncate text-sm font-semibold text-slate-900">{viewer.firstName} {viewer.lastName}</span><span className="block truncate text-xs text-slate-500">{viewer.role}</span></span> : null}
          <ChevronDown className={cn("size-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
        {open ? (
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,330px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="menu">
            <div className="border-b border-slate-200 p-4">
              <p className="truncate font-semibold text-slate-950">{viewer.firstName} {viewer.lastName}</p>
              <p className="mt-0.5 break-all text-xs text-slate-500">{viewer.email}</p>
              <div className="mt-2"><RoleBadge role={viewer.role} /></div>
            </div>
            <div className="p-2">
              <MenuLink href="/profile" icon={UserRound} onClick={() => setOpen(false)}>View profile</MenuLink>
              <MenuLink href="/profile/change-password" icon={KeyRound} onClick={() => setOpen(false)}>Change password</MenuLink>
              <MenuLink href="/help" icon={HelpCircle} onClick={() => setOpen(false)}>Help & support</MenuLink>
            </div>
            <div className="border-y border-slate-200 bg-slate-50 p-3">
              <label htmlFor="demo-role" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><RefreshCw className={cn("size-3.5", switching && "animate-spin")} aria-hidden="true" /> Preview another role</label>
              <select id="demo-role" value={viewer.role} onChange={(event) => switchRole(event.target.value as UserRole)} disabled={switching} className="mt-2 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70">
                {roles.map((role) => <option value={role} key={role}>{role}</option>)}
              </select>
              <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Demo control only. Production roles are managed by administrators.</p>
            </div>
            <div className="p-2">
              <button type="button" onClick={() => { setOpen(false); setLogoutOpen(true); }} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-red-700 hover:bg-red-50" role="menuitem"><LogOut className="size-4.5" aria-hidden="true" /> Sign out</button>
            </div>
          </div>
        ) : null}
      </div>
      <ConfirmationDialog open={logoutOpen} title="Sign out of LUNAS?" description="Your secure command-center session will end. Any unsaved changes on this page will be lost." confirmLabel="Confirm sign out" destructive loading={loggingOut} onClose={() => setLogoutOpen(false)} onConfirm={logout} />
    </>
  );
}

function MenuLink({ href, icon: Icon, children, onClick }: { href: string; icon: typeof UserRound; children: React.ReactNode; onClick: () => void }) {
  return <Link href={href} onClick={onClick} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950" role="menuitem"><Icon className="size-4.5 text-slate-500" aria-hidden="true" />{children}</Link>;
}
