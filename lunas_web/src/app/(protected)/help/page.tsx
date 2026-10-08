import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/dal.server";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Help and Support" };

export default async function HelpPage() {
  const viewer = await requirePermission("support.create");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Account support"
        title="Help and Support"
        description="For account-access or reporting concerns, contact the LUNAS support team through an authorized channel."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Help and Support" }]}
      />
      <Card className="p-6 sm:p-7">
        <div className="flex gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Mail className="size-5" aria-hidden="true" /></span>
          <div>
            <h2 className="font-semibold text-slate-950">Contact LUNAS Support</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Use the support contact issued by your organization. Include your account email and a short description of the issue; do not include your password or a verification code.</p>
            <p className="mt-3 break-all text-sm font-semibold text-brand-800">Signed-in account: {viewer.email}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />LUNAS support will never ask for your password, reset link, or verification code.</div>
      </Card>
    </div>
  );
}
