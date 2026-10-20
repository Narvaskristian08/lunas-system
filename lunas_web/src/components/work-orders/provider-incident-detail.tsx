"use client";
import { categoryLabel } from "@/lib/category-label";

/* Signed private evidence URLs are dynamic and intentionally not passed to Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Building2, ExternalLink, MapPin } from "lucide-react";
import { updateAgencyStatusAction } from "@/app/actions/tanod-workflow";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { priorityTone, titleCase } from "@/components/work-orders/work-order-ui";
import type { ProviderRoutedIncident } from "@/lib/work-orders.server";
import { formatDateTime } from "@/lib/utils";
import { AgencyPreparationPanel } from "./agency-preparation";

function address(incident: ProviderRoutedIncident) {
  return [incident.location.address.street, incident.location.address.barangay, incident.location.address.city]
    .filter(Boolean)
    .join(", ") || "Location unavailable";
}

const agencyStatuses = [
  { value: "ready_for_work", label: "Ready for work", description: "Haven't started" },
  { value: "pending_procurement", label: "Pending procurement / bidding", description: "External process" },
  { value: "work_in_progress", label: "Work in progress", description: "Repair underway" },
  { value: "work_completed", label: "Work completed", description: "Ready for final check" },
] as const;
const agencyStatusOrder = {
  ready_for_work: 0,
  pending_procurement: 1,
  work_in_progress: 2,
  work_completed: 3,
} as const;
const normalizeAgencyStatus = (status: string) => {
  if (status === "pending_budget") return "pending_procurement";
  if (status === "in_progress") return "work_in_progress";
  if (status === "completed") return "work_completed";
  return status;
};
const nextAgencyStatus = (status: string) => {
  if (status === "correction_required") return "work_in_progress";
  const current = normalizeAgencyStatus(status);
  return agencyStatuses[agencyStatusOrder[current as keyof typeof agencyStatusOrder] + 1]?.value;
};

export function ProviderIncidentDetail({ incident }: { incident: ProviderRoutedIncident }) {
  const [agencyStatus, setAgencyStatus] = useState(incident.agencyStatus ?? "ready_for_work");
  const agencyPriority = incident.priority ?? "";
  const [agencyNote, setAgencyNote] = useState("");
  const slaDeadline = incident.sla.deadline ?? "";
  const [agencyMessage, setAgencyMessage] = useState<string>();
  const [statusToConfirm, setStatusToConfirm] = useState<string>();
  const [pending, startTransition] = useTransition();
  const [longitude, latitude] = incident.location.coordinates;
  const coordinateText = typeof longitude === "number" && typeof latitude === "number"
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : undefined;
  const mapHref = coordinateText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateText)}`
    : undefined;

  const selectedStatus = agencyStatus === "correction_required" ? "work_in_progress" : normalizeAgencyStatus(agencyStatus);
  const currentStatus = agencyStatuses.find((status) => status.value === selectedStatus) ?? agencyStatuses[0];
  const nextStatus = nextAgencyStatus(agencyStatus);
  const currentOrder = agencyStatusOrder[selectedStatus as keyof typeof agencyStatusOrder] ?? 0;
  const nextStepLabel = nextStatus
    ? agencyStatuses.find((status) => status.value === nextStatus)?.label
    : "Final verification";

  const applyAgencyStatus = (status: string) => {
    setStatusToConfirm(undefined);
    startTransition(async () => {
      const response = await updateAgencyStatusAction(incident.id, status, agencyNote);
      if (response.ok) setAgencyStatus(status);
      setAgencyMessage(response.message);
    });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/work-orders?view=orders" className={buttonStyles({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Agency Reports
        </Link>
      </div>

      <div className="mb-6">
        <p className="text-xs font-bold tracking-normal text-brand-700">Utility Provider · Agency incident</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{incident.reportNumber}</h1>
          {incident.priority ? <Badge tone={priorityTone(incident.priority)}>{titleCase(incident.priority)}</Badge> : null}
          <StatusBadge tone="information">{titleCase(incident.status)}</StatusBadge>
        </div>
        <p className="mt-1.5 text-sm text-slate-600">Review the agency-routed incident. Maintenance requires separate approved authorization.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
        <main className="space-y-5">
          <Card className="overflow-hidden">
            <CardHeader title="Incident Details" description="The report is read-only at the Utility Provider handoff." />
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">{categoryLabel(incident.category, "Uncategorized")}</Badge>
                {incident.routedAt ? <span className="text-xs text-slate-500">Routed {formatDateTime(incident.routedAt)}</span> : null}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Citizen Report</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{incident.description ?? "No incident description available."}</p>
              </div>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Responsible Organization</dt><dd className="mt-1 inline-flex items-center gap-1.5 font-semibold text-slate-950"><Building2 className="size-4" aria-hidden="true" />{incident.responsibleOrganization ?? "Unavailable"}</dd></div>
                <div><dt className="text-slate-500">SLA Deadline</dt><dd className="mt-1 font-semibold text-slate-950">{incident.sla.deadline ? formatDateTime(incident.sla.deadline) : "Not available"}</dd></div>
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
            <CardHeader title="Citizen Evidence" />
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
          {!incident.workOrder && (incident.status === "provider_assigned" || incident.agencyPreparation) ? <AgencyPreparationPanel incident={incident} /> : <>
          <Card className="sticky top-24 mb-5 overflow-hidden">
            <CardHeader title="Agency Update" description="Budget, bidding, and repair happen outside LUNAS. Record the agency's current status here." />
            <div className="space-y-4 p-5">
              {incident.agencyStatus === "correction_required" ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Secretary correction request: {incident.agencyStatusNote || "Review the final verification and correct the work."}</p> : null}
              <fieldset>
                <legend className="text-sm font-semibold text-slate-900">External process status</legend>
                <div className="mt-3 flex items-center gap-1" aria-label="Agency work progress">
                  {agencyStatuses.map((status, index) => {
                    const currentOrder = agencyStatusOrder[selectedStatus as keyof typeof agencyStatusOrder] ?? 0;
                    return <div key={status.value} className={`h-2 flex-1 rounded-full ${index <= currentOrder ? "bg-brand-600" : "bg-slate-200"}`} />;
                  })}
                </div>
                {selectedStatus === "ready_for_work" ? <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <label className="block text-sm font-semibold text-slate-900">Agency priority<select value={agencyPriority} disabled className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm" required><option value="">Select priority</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
                  <p className="mt-2 text-xs leading-5 text-slate-500">Existing priority is preserved. Assignment or amendment requires approved authorization.</p>
                </div> : <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm"><p className="font-semibold text-slate-900">Ready for Work details</p><p className="mt-1 text-slate-700">Agency priority: <span className="font-semibold">{agencyPriority ? titleCase(agencyPriority) : "Not recorded"}</span></p><p className="mt-1 text-xs text-slate-500">This priority was recorded during the first step.</p></div>}
                {selectedStatus === "pending_procurement" || selectedStatus === "work_in_progress" || selectedStatus === "work_completed" ? <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-semibold text-slate-900">Agency SLA deadline</p><p>{slaDeadline ? formatDateTime(slaDeadline) : "Not recorded"}</p><p className="mt-2 text-xs text-slate-500">Existing SLA timing is preserved. Starting or amending a deadline requires approved authorization.</p>{incident.sla.targetResolutionTime ? <p className="mt-1 text-xs text-slate-500">Target: {incident.sla.targetResolutionTime} hours</p> : null}</div> : null}
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-semibold text-brand-700">Current step: {currentStatus.label}</p>
                  <p className="font-semibold text-slate-600">Next step: {nextStepLabel}</p>
                </div>
                {agencyStatuses.slice(0, currentOrder).map((status) => <div key={status.value} className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm"><p className="font-semibold text-slate-900">{status.label}</p>{status.value === "ready_for_work" ? <p className="mt-1 text-slate-700">Agency priority: <span className="font-semibold">{agencyPriority ? titleCase(agencyPriority) : "Not recorded"}</span></p> : null}{status.value === "pending_procurement" ? <p className="mt-1 text-slate-700">Deadline: <span className="font-semibold">{slaDeadline ? formatDateTime(slaDeadline) : incident.sla.deadline ? formatDateTime(incident.sla.deadline) : "Not recorded"}</span></p> : null}<p className="mt-1 text-xs text-slate-500">Completed step</p></div>)}
                <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{currentStatus.label}</p>
                  <p className="mt-1 text-xs text-slate-600">{currentStatus.description}</p>
                  {nextStatus ? <Button type="button" className="mt-3 w-full" disabled={pending || (!agencyPriority && !incident.priority) || (selectedStatus === "pending_procurement" && !slaDeadline)} onClick={() => setStatusToConfirm(nextStatus)}>Continue to Next Step</Button> : <p className="mt-3 text-xs font-semibold text-emerald-700">Agency status recorded as work completed.</p>}
                  {!agencyPriority && !incident.priority ? <p className="mt-2 text-xs text-amber-800">Select an agency priority before moving to the next step.</p> : null}
                  {selectedStatus === "pending_procurement" && !slaDeadline ? <p className="mt-2 text-xs text-amber-800">An authorized SLA start is required before moving to Work in Progress.</p> : null}
                </div>
              </fieldset>
              <textarea value={agencyNote} onChange={(event) => setAgencyNote(event.target.value)} maxLength={2000} rows={4} placeholder="Agency update or external reference" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              {agencyMessage ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{agencyMessage}</p> : null}
            </div>
          </Card>
          </>}
        </aside>
      </div>
      <ConfirmationDialog
        open={Boolean(statusToConfirm)}
        onClose={() => !pending && setStatusToConfirm(undefined)}
        onConfirm={() => {
          if (statusToConfirm) applyAgencyStatus(statusToConfirm);
        }}
        loading={pending}
        icon="none"
        title="Change agency status?"
        description={`Set this report to ${agencyStatuses.find((status) => status.value === statusToConfirm)?.label ?? "the selected status"}? This will save the change immediately.`}
        confirmLabel="Confirm Status"
      />
    </div>
  );
}
