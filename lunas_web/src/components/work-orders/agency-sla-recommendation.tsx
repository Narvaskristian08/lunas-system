"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { getSlaRecommendationAction } from "@/app/actions/sla-recommendation";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import type { SlaRecommendation } from "@/lib/sla-recommendation";

export function AgencySlaRecommendation({ incidentId, priority, locked, policyReferenceHours }: {
  incidentId: string; priority: string; locked: boolean; policyReferenceHours?: number;
}) {
  const [recommendation, setRecommendation] = useState<SlaRecommendation>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const generate = async () => {
    setPending(true); setError(undefined); setRecommendation(undefined);
    try {
      const result = await getSlaRecommendationAction(incidentId, priority);
      if (result.ok) setRecommendation(result.data);
      else setError(result.message);
    } catch { setError("AI SLA recommendation is unavailable. Enter the agency deadline manually."); }
    finally { setPending(false); }
  };

  return (
    <section aria-label="AI SLA recommendation" className="mt-4 min-w-0 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-900"><Sparkles className="size-4 shrink-0" aria-hidden="true" />AI SLA recommendation</h3>
        <span className="rounded-full border border-brand-200 bg-white px-2 py-0.5 text-xs font-medium text-brand-700">Advisory only</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-brand-900">Request a model-generated planning estimate. Your agency chooses the official deadline; this does not fill or save the date field.</p>
      {locked ? <p className="mt-3 text-xs leading-5 text-slate-600">The deadline is already recorded and locked. New planning recommendations are available only before work starts.</p> : (
        <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" disabled={pending || !priority} loading={pending} loadingLabel="Requesting AI estimate…" onClick={generate}>
          {recommendation ? "Generate another estimate" : "Generate AI suggestion"}
        </Button>
      )}
      {!locked && !priority ? <p className="mt-2 text-xs text-brand-800">Select the agency priority first.</p> : null}
      {error ? <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">{error}</p> : null}
      {recommendation ? (
        <div aria-live="polite" className="mt-4 space-y-3 border-t border-brand-200 pt-3">
          <p className="text-2xl font-bold text-brand-950">{recommendation.durationHours}<span className="ml-1.5 text-sm font-medium">hours</span></p>
          <p className="text-sm leading-6 text-brand-900">{recommendation.explanation}</p>
          <div className="rounded-lg border border-brand-200 bg-white p-3 text-xs leading-5">
            <p className="font-semibold text-slate-900">Planning date if work starts now</p>
            <p className="mt-1 font-semibold text-brand-900">{formatDateTime(recommendation.referenceDeadline)} (Philippine time)</p>
            <p className="mt-1 text-slate-600">Calculated from the AI duration, not your official SLA. Procurement time is unknown.</p>
          </div>
          <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-brand-900">{recommendation.assumptions.map((item, index) => <li key={index}>{item}</li>)}</ul>
          <p className="break-words text-xs leading-5 text-slate-600">Model: {recommendation.model} · Generated {formatDateTime(recommendation.generatedAt)}. Unvalidated estimate; review feasibility before entering a deadline.</p>
        </div>
      ) : null}
      {policyReferenceHours ? <p className="mt-3 border-t border-brand-200 pt-3 text-xs leading-5 text-slate-600">Configured priority target: {policyReferenceHours} hours. This fixed rule is a separate reference, not an AI output.</p> : null}
    </section>
  );
}
