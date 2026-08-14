import Link from "next/link";
import { Construction, LockKeyhole } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** A truthful boundary for workflow modules scheduled after Milestone 1. */
export function MilestoneUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex min-h-[52vh] max-w-2xl items-center">
      <Card className="w-full p-6 text-center sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
          <Construction className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Planned after Milestone 1</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs leading-5 text-slate-600">
          <LockKeyhole className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
          This workflow is not available in the current release, so no sample or placeholder records are shown.
        </div>
        <Link href="/dashboard" className={buttonStyles({ className: "mt-6" })}>Return to dashboard</Link>
      </Card>
    </div>
  );
}
