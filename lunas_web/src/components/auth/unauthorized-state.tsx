"use client";

import { SystemState } from "@/components/states/system-state";
import type { UserRole } from "@/types";

export function UnauthorizedState({ role, context }: { role: UserRole; context: string }) {
  const mobileOnlyRole = role === "Citizen" || role === "Repair Personnel";
  return (
    <SystemState
      kind="unauthorized"
      eyebrow="Restricted access"
      title="This area is not available to your account"
      description="You are signed in, but your assigned permissions do not include this page or action. No restricted record details have been shown."
      role={role}
      detail={
        <div>
          <p className="font-semibold text-slate-800">Requested Context</p>
          <p className="mt-1">{context}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">If this access is required for your official duties, contact an authorized LUNAS administrator or send a support request.</p>
        </div>
      }
      primaryAction={mobileOnlyRole
        ? { label: "Contact Support", href: "mailto:lunas-support@dagupan.gov.ph" }
        : { label: "Return to Dashboard", href: "/dashboard" }}
      secondaryAction={{ label: "Go Back", onClick: () => window.history.back() }}
      tertiaryAction={!mobileOnlyRole ? { label: "Contact Support", href: "/help#contact-support" } : undefined}
    />
  );
}
