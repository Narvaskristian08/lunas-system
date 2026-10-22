"use client";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

export interface MaintenanceTracking {
  progressPercent: number;
  active: boolean;
  acceptedAt?: string | null;
  cycles: Array<{ reference: string; startedAt: string; completedAt: string | null; elapsedMilliseconds: number | null }>;
}
export function MaintenanceProgress({ tracking }: { tracking?: MaintenanceTracking }) {
  const [clock, setClock] = useState<{ source?: MaintenanceTracking; milliseconds: number }>({ milliseconds: 0 });
  useEffect(() => {
    if (!tracking?.active) return;
    const start = performance.now();
    const timer = setInterval(() => setClock({ source: tracking, milliseconds: performance.now() - start }), 1000);
    return () => clearInterval(timer);
  }, [tracking]);
  if (!tracking) return null;
  const elapsed = clock.source === tracking ? clock.milliseconds : 0;
  const duration = (value: number | null) => value == null ? "Unavailable" : `${Math.floor(value / 86400000)}d ${Math.floor(value / 3600000) % 24}h ${Math.floor(value / 60000) % 60}m ${Math.floor(value / 1000) % 60}s`;
  return <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="font-semibold">Physical repair progress: {tracking.progressPercent}%</h2>
    <progress className="h-3 w-full accent-blue-700" value={tracking.progressPercent} max={100} aria-label="Agency-reported physical repair progress" />
    <p className="text-xs text-slate-500">Agency-reported work progress. Secretary acceptance is a separate decision.</p>
    {tracking.cycles.length ? tracking.cycles.map((cycle, index) => <div key={cycle.reference} className="border-t pt-3 text-sm"><h3 className="font-semibold">Work cycle {index + 1}</h3><p>Started: {formatDateTime(cycle.startedAt)}</p><p>Agency completed: {cycle.completedAt ? formatDateTime(cycle.completedAt) : "Not recorded"}</p><p>Elapsed repair time: {duration(cycle.elapsedMilliseconds == null ? null : cycle.elapsedMilliseconds + (tracking.active && index === tracking.cycles.length - 1 ? elapsed : 0))}</p></div>) : <p className="text-sm">Work has not started; elapsed repair time is unavailable.</p>}
    {tracking.acceptedAt ? <p className="text-sm">Secretary accepted: {formatDateTime(tracking.acceptedAt)}</p> : null}
  </section>;
}
