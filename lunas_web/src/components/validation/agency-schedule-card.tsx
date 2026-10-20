"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { remainingTimeLabel, type AgencySchedule } from "@/lib/agency-schedule";

export function AgencyScheduleCard({ schedule }: { schedule?: AgencySchedule }) {
  const router = useRouter();
  useEffect(() => {
    if (!schedule || ["resolved", "inactive"].includes(schedule.state)) return;
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [router, schedule]);
  const [clock, setClock] = useState<{ source?: AgencySchedule; elapsed: number }>({ elapsed: 0 });
  const elapsed = clock.source === schedule ? clock.elapsed : 0;
  useEffect(() => {
    if (!schedule || ["resolved", "awaiting_verification", "inactive"].includes(schedule.state) || schedule.remainingMilliseconds == null) return;
    const origin = performance.now();
    const timer = window.setInterval(() => setClock({ source: schedule, elapsed: performance.now() - origin }), 1000);
    return () => window.clearInterval(timer);
  }, [schedule]);
  const stopped = ["resolved", "awaiting_verification", "inactive"].includes(schedule?.state || "");
  const remaining = schedule?.remainingMilliseconds == null ? null : schedule.remainingMilliseconds - (stopped ? 0 : elapsed);
  const fraction = remaining != null && (schedule?.durationMilliseconds ?? 0) > 0
    ? Math.max(0, Math.min(1, remaining / schedule!.durationMilliseconds!)) : null;
  const title = schedule?.state === "resolved" ? "Resolved"
    : schedule?.state === "awaiting_verification" ? "Awaiting final verification"
      : schedule?.state === "inactive" ? "Schedule no longer active"
        : remaining == null ? "Awaiting agency schedule" : remaining <= 0 ? "Deadline passed" : remainingTimeLabel(remaining);
  const overdue = !stopped && remaining != null && remaining <= 0;
  const deadline = schedule?.deadline ? new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }).format(new Date(schedule.deadline)) : null;
  return <section aria-label="Agency schedule" className="my-5 rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Clock3 className="size-4 text-brand-700" aria-hidden="true" />Agency schedule</h2>
      <span className={`text-sm font-semibold ${overdue ? "text-red-700" : "text-brand-700"}`}>{title}</span>
    </div>
    <div role="progressbar" aria-label="Agency time remaining" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fraction == null ? undefined : Math.round(fraction * 100)} aria-valuetext={title} className="relative mt-4 h-3 rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${overdue ? "bg-red-600" : "bg-brand-600"}`} style={{ width: `${(fraction ?? 0) * 100}%` }} />
      {fraction != null ? <span aria-hidden="true" className={`absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${overdue ? "bg-red-600" : "bg-brand-600"}`} style={{ left: `clamp(8px, ${fraction * 100}%, calc(100% - 8px))` }} /> : null}
    </div>
    <p className="mt-3 text-sm text-slate-700">{deadline ? `Agency target: ${deadline} (Philippine time)` : "The agency has not recorded a target date."}</p>
    {overdue && remaining != null ? <p className="mt-1 text-sm font-medium text-red-700">{remainingTimeLabel(remaining)}</p> : null}
    <p className="mt-2 text-xs leading-5 text-slate-500">{schedule?.state === "resolved" ? "Final verification accepted. Countdown stopped." : schedule?.state === "inactive" ? "This report is no longer awaiting agency work." : stopped ? "Agency work is complete. Final verification is pending." : fraction == null && deadline ? "A valid work-start period is unavailable, so the percentage cannot be shown." : "The bar decreases from the recorded start to the agency target. This is a target, not a guaranteed completion date."}</p>
  </section>;
}
