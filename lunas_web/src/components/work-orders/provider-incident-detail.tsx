"use client";

/* Signed private evidence URLs are dynamic and intentionally not passed to Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, ExternalLink, MapPin } from "lucide-react";
import { createWorkOrderAction, type WorkOrderActionResult } from "@/app/actions/work-orders";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { priorityTone, titleCase } from "@/components/work-orders/work-order-ui";
import type { ProviderRoutedIncident } from "@/lib/work-orders.server";
import { formatDateTime } from "@/lib/utils";

function address(incident: ProviderRoutedIncident) {
  return [incident.location.address.street, incident.location.address.barangay, incident.location.address.city]
    .filter(Boolean)
    .join(", ") || "Location unavailable";
}

export function ProviderIncidentDetail({ incident }: { incident: ProviderRoutedIncident }) {
  const [instructions, setInstructions] = useState("");
  const [result, setResult] = useState<WorkOrderActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [longitude, latitude] = incident.location.coordinates;
  const coordinateText = typeof longitude === "number" && typeof latitude === "number"
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : undefined;
  const mapHref = coordinateText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateText)}`
    : undefined;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);
    startTransition(async () => {
      setResult(await createWorkOrderAction({ incidentId: incident.id, instructions }));
    });
  };

  const createdWorkOrderId = result?.ok ? result.workOrderId : incident.workOrder?.id;
  const canCreate = incident.status === "provider_assigned" && !incident.workOrder;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/work-orders/intake" className={buttonStyles({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Routed incidents
        </Link>
        <Link href="/work-orders" className={buttonStyles({ variant: "secondary", size: "sm" })}>Open work orders</Link>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Utility Provider · Initial work order</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{incident.reportNumber}</h1>
          {incident.priority ? <Badge tone={priorityTone(incident.priority)}>{titleCase(incident.priority)}</Badge> : null}
          <StatusBadge tone="information">{titleCase(incident.status)}</StatusBadge>
        </div>
        <p className="mt-1.5 text-sm text-slate-600">Review the City-routed incident before creating its single primary work order.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <main className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader title="Incident details" description="The report is read-only at the Utility Provider handoff." />
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{titleCase(incident.category, "Uncategorized")}</Badge>
                {incident.routedAt ? <span className="text-xs text-slate-500">Routed {formatDateTime(incident.routedAt)}</span> : null}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Citizen report</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{incident.description ?? "No incident description available."}</p>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Responsible organization</dt><dd className="mt-1 inline-flex items-center gap-1.5 font-semibold text-slate-950"><Building2 className="size-4" aria-hidden="true" />{incident.responsibleOrganization ?? "Unavailable"}</dd></div>
                <div><dt className="text-slate-500">SLA deadline</dt><dd className="mt-1 font-semibold text-slate-950">{incident.sla.deadline ? formatDateTime(incident.sla.deadline) : "Not available"}</dd></div>
              </dl>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Location" description="Citizen-submitted coordinates and address confirmed during official review." />
            <div className="flex items-start gap-3 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin className="size-5" aria-hidden="true" /></span>
              <div>
                <p className="font-semibold text-slate-950">{address(incident)}</p>
                {coordinateText ? <p className="mt-1 font-mono text-xs text-slate-600">{coordinateText}</p> : null}
                {mapHref ? <a href={mapHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Open in Google Maps <ExternalLink className="size-3.5" aria-hidden="true" /></a> : null}
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Citizen evidence" description="Private evidence URLs are generated by the backend for this authorized view." />
            {incident.images.length ? (
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {incident.images.map((evidence, index) => evidence.url ? (
                  <figure key={evidence.id || index} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img src={evidence.url} alt={`Incident evidence ${index + 1}`} className="aspect-video w-full object-cover" />
                    <figcaption className="px-3 py-2 text-xs text-slate-500">Evidence {index + 1}</figcaption>
                  </figure>
                ) : (
                  <div key={evidence.id || index} className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">Evidence unavailable</div>
                ))}
              </div>
            ) : <p className="p-5 text-sm text-slate-600">No evidence is available for this incident.</p>}
          </Card>
        </main>

        <aside>
          <Card className="sticky top-24 overflow-hidden">
            <CardHeader title="Create initial work order" description="One primary work order is allowed for this routed incident." />
            <div className="space-y-4 p-5">
              {createdWorkOrderId ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status" aria-live="polite">
                  <div className="flex items-start gap-2 text-emerald-900"><CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">Work order ready for assignment</p><p className="mt-1 text-sm leading-5">Continue to the work order to select eligible Repair Personnel from your organization.</p></div></div>
                  <Link href={`/work-orders/${encodeURIComponent(createdWorkOrderId)}`} className={buttonStyles({ className: "mt-4 w-full" })}>Assign repair personnel <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </div>
              ) : canCreate ? (
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label htmlFor="instructions" className="text-sm font-semibold text-slate-900">Provider instructions <span className="font-normal text-slate-500">(optional)</span></label>
                    <textarea
                      id="instructions"
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                      maxLength={4000}
                      rows={6}
                      placeholder="Add safety, access, scheduling, or repair instructions for the assigned personnel."
                      className="mt-1 min-h-32 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70"
                    />
                    <p className="mt-1 text-right text-xs text-slate-500">{instructions.length}/4000</p>
                  </div>
                  {result && !result.ok ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-900">{result.message}</div> : null}
                  <Button type="submit" loading={pending} loadingLabel="Creating work order…" className="w-full">Create work order</Button>
                  <p className="text-xs leading-5 text-slate-500">Organization, priority, jurisdiction, SLA, and incident linkage are copied by the backend. They cannot be changed in this form.</p>
                </form>
              ) : (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                  This incident is no longer in the provider-assigned state and cannot receive an initial work order. Return to the intake queue for the latest status.
                </div>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
