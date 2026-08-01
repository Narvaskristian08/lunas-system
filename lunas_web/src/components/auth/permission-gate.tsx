"use client";

import { LockKeyhole } from "lucide-react";
import { AccessDeniedState } from "@/components/states/system-state";
import { useViewer } from "@/components/providers/viewer-provider";
import { hasPermission } from "@/lib/permissions";
import type { Permission } from "@/types";

export function PermissionGate({
  permission,
  children,
  fallback = null,
  mode = "hide",
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: "hide" | "disabled" | "denied";
}) {
  const viewer = useViewer();
  if (hasPermission(viewer, permission)) return children;
  if (mode === "denied") return <AccessDeniedState role={viewer.role} />;
  if (mode === "disabled") {
    return fallback ?? (
      <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 font-semibold text-slate-500" aria-disabled="true" title={`Not available for ${viewer.role}`}>
        <LockKeyhole className="size-4" aria-hidden="true" /> Restricted action
      </span>
    );
  }
  return fallback;
}
