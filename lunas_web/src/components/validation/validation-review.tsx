"use client";

/* Signed private evidence URLs are dynamic and intentionally not passed to Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardPlus, ExternalLink, FileImage, MapPin, Route, ShieldCheck, XCircle } from "lucide-react";
import { createWorkOrderAction } from "@/app/actions/work-orders";
import { markDuplicateAction, rejectIncidentAction, validateIncidentAction } from "@/app/actions/validation";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import type { ValidationIncident, ValidationPriority } from "@/lib/validation.server";
import { formatDateTime } from "@/lib/utils";
import type { Severity, UserProfile } from "@/types";

type Decision = "validate" | "reject" | "duplicate";
type Responsibility = "barangay" | "city_engineering" | "utility_provider";

const priorities: ValidationPriority[] = ["critical", "high", "medium", "low"];
const responsibilities: Array<{ value: Responsibility; label: string }> = [
  { value: "barangay", label: "Barangay" },
  { value: "city_engineering", label: "City Engineering" },
  { value: "utility_provider", label: "Utility Provider" },
];

function titleCase(value: string | undefined, fallback = "Not assigned") {
  if (!value) return fallback;
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string): Severity {
  if (status === "validated") return "success";
  if (status === "rejected") return "critical";
  if (status === "duplicate") return "neutral";
  return "warning";
}

function priorityTone(priority: ValidationPriority): Severity {
  if (priority === "critical") return "critical";
  if (priority === "high") return "warning";
  if (priority === "medium") return "information";
  return "neutral";
}

function fieldClass() {
  return "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70";
}

function Coordinates({ incident }: { incident: ValidationIncident }) {
  const [longitude, latitude] = incident.location.coordinates;
  const coordinateText = typeof longitude === "number" && typeof latitude === "number"
    ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    : undefined;
  const mapsHref = coordinateText
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinateText)}`
    : undefined;
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Location review" description="Citizen-submitted location; officials can confirm its jurisdiction before validating." />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><MapPin className="size-5" aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-950">{[incident.location.address.street, incident.location.address.barangay, incident.location.address.city].filter(Boolean).join(", ") || "Location details unavailable"}</p>
            {coordinateText ? <p className="mt-1 font-mono text-xs text-slate-600">{coordinateText}</p> : <p className="mt-1 text-sm text-amber-800">Coordinates were unavailable in this report.</p>}
            {mapsHref ? <a href={mapsHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">Open verified coordinates in maps <ExternalLink className="size-3.5" aria-hidden="true" /></a> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Evidence({ incident }: { incident: ValidationIncident }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Evidence review" description="Only privacy-processed evidence URLs from the protected API are displayed." />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {incident.images.length ? incident.images.map((image, index) => (
          <div key={`${image.url ?? "evidence"}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {image.url ? <a href={image.url} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-slate-100"><img src={image.url} alt={`Submitted evidence ${index + 1}`} className="size-full object-cover" /></a> : <div className="flex aspect-[4/3] items-center justify-center text-slate-500"><FileImage className="size-8" aria-hidden="true" /></div>}
            <div className="flex flex-wrap gap-2 border-t border-slate-200 px-3 py-2.5 text-xs text-slate-600">
              {image.quality?.status ? <Badge tone={image.quality.status === "passed" ? "success" : "neutral"}>Quality: {titleCase(image.quality.status)}</Badge> : null}
              {image.privacyProcessing?.status ? <Badge tone={image.privacyProcessing.applied ? "success" : "warning"}>Privacy: {titleCase(image.privacyProcessing.status)}</Badge> : null}
            </div>
          </div>
        )) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">No evidence preview is currently available.</div>}
      </div>
    </Card>
  );
}

function Timeline({ incident }: { incident: ValidationIncident }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Status history" description="Events are recorded by the backend; this timeline is not fabricated by the interface." />
      <ol className="divide-y divide-slate-200">
        {incident.history.length ? incident.history.map((entry, index) => <li key={`${entry.status}-${entry.changedAt ?? index}`} className="flex gap-3 px-5 py-4"><span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-700" aria-hidden="true" /><div><p className="font-semibold text-slate-900">{titleCase(entry.status)}</p>{entry.changedAt ? <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(entry.changedAt)}</p> : null}{entry.notes ? <p className="mt-1 text-sm text-slate-600">{entry.notes}</p> : null}</div></li>) : <li className="px-5 py-5 text-sm text-slate-600">No status events are available.</li>}
      </ol>
    </Card>
  );
}

function ValidationRoutingSummary({ incident }: { incident: ValidationIncident }) {
  const hasActiveSla = incident.sla?.state === "active";
  const deadline = incident.sla?.deadline ? formatDateTime(incident.sla.deadline) : undefined;
  const targetHours = incident.sla?.targetResolutionTime;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Validation, routing, and SLA" description="Operational values are assigned by the protected validation workflow, not by the browser." />
      <dl className="divide-y divide-slate-200 text-sm">
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Priority</dt><dd className="text-right font-semibold text-slate-900">{hasActiveSla && incident.priority ? titleCase(incident.priority) : "Not assigned"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Jurisdiction</dt><dd className="text-right font-semibold text-slate-900">{incident.jurisdiction ?? incident.location.address.barangay ?? "To be confirmed"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">Responsible organization</dt><dd className="text-right font-semibold text-slate-900">{incident.routing?.responsibleOrganization ?? "To be routed"}</dd></div>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5"><dt className="text-slate-600">SLA</dt><dd className="max-w-56 text-right font-semibold text-slate-900">{hasActiveSla ? <>{targetHours ? `${targetHours} hour target` : "Active"}{deadline ? <span className="mt-0.5 block text-xs font-normal text-slate-600">Due {deadline}</span> : null}</> : "Starts after validation"}</dd></div>
      </dl>
    </Card>
  );
}

export function ValidationReview({ viewer, incident }: { viewer: UserProfile; incident: ValidationIncident }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("validate");
  const [priority, setPriority] = useState<ValidationPriority>(incident.priority ?? "medium");
  const [barangay, setBarangay] = useState(incident.jurisdiction ?? incident.location.address.barangay ?? "");
  const [responsibility, setResponsibility] = useState<Responsibility>(incident.jurisdictionResponsibility ?? incident.routing?.responsibleRole ?? "barangay");
  const [organization, setOrganization] = useState(incident.routing?.responsibleOrganization ?? "");
  const [routingReason, setRoutingReason] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [workOrderInstructions, setWorkOrderInstructions] = useState("");
  const [duplicateOf, setDuplicateOf] = useState(incident.duplicateCandidates[0]?.id ?? "");
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const canDecide = viewer.permissions.includes("reports.validate") && incident.status === "submitted";
  const canCreateWorkOrder = viewer.permissions.includes("work_orders.manage")
    && ["barangay_official", "city_engineer", "utility_provider", "admin"].includes(viewer.backendRole)
    && incident.status === "validated"
    && !incident.workOrder?.id;

  const duplicateOptions = useMemo(() => incident.duplicateCandidates.map((candidate) => ({ value: candidate.id, label: `${candidate.reportNumber} · ${candidate.location?.address.barangay ?? "location unavailable"}` })), [incident.duplicateCandidates]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    if (!canDecide) return;
    if (decision === "validate" && (!barangay.trim() || !organization.trim())) {
      setError("Confirm a barangay and responsible organization before validating.");
      return;
    }
    if (decision === "reject" && !reason.trim()) {
      setError("Provide a rejection reason before continuing.");
      return;
    }
    if (decision === "duplicate" && (!duplicateOf || !reason.trim())) {
      setError("Select or enter a canonical report and provide a duplicate reason.");
      return;
    }
    setConfirm(true);
  };

  const confirmDecision = () => {
    startTransition(async () => {
      const result = decision === "validate"
        ? await validateIncidentAction({ incidentId: incident.id, priority, jurisdiction: { barangay, city: incident.location.address.city, responsibility }, routing: { responsibleOrganization: organization, responsibleRole: responsibility, reason: routingReason }, notes })
        : decision === "reject"
          ? await rejectIncidentAction({ incidentId: incident.id, reason, notes })
          : await markDuplicateAction({ incidentId: incident.id, duplicateOf, reason, notes });
      setConfirm(false);
      if (!result.ok) {
        setError(result.message);
        if (result.conflict) router.refresh();
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  };

  const decisionTitle = decision === "validate" ? "Validate report" : decision === "reject" ? "Reject report" : "Mark report as duplicate";
  const createWorkOrder = () => {
    startTransition(async () => {
      const result = await createWorkOrderAction({ incidentId: incident.id, instructions: workOrderInstructions });
      if (!result.ok) {
        setError(result.message);
        if (result.conflict) router.refresh();
        return;
      }
      setMessage(result.message);
      if (result.workOrderId) {
        router.push(`/work-orders/${encodeURIComponent(result.workOrderId)}`);
        return;
      }
      router.refresh();
    });
  };
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><p className="text-sm font-semibold text-brand-700">Official review · {viewer.organization}</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{incident.reportNumber}</h1><p className="mt-2 max-w-3xl text-slate-600">Review citizen evidence, location, history, and advisory duplicate candidates before recording a controlled decision.</p></div>
        <StatusBadge tone={statusTone(incident.status)}>{titleCase(incident.status)}</StatusBadge>
      </div>

      {message ? <div role="status" className="mb-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />{message}</div> : null}
      {error ? <div role="alert" className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-950"><AlertTriangle className="size-5 shrink-0" aria-hidden="true" />{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Evidence incident={incident} />
          <Card className="overflow-hidden"><CardHeader title="Citizen report" description={incident.createdAt ? `Submitted ${formatDateTime(incident.createdAt)}` : "Submission time unavailable"} /><div className="space-y-4 p-5"><div className="flex flex-wrap gap-2"><Badge tone="information">{titleCase(incident.category)}</Badge>{incident.subcategory ? <Badge>{titleCase(incident.subcategory)}</Badge> : null}{incident.aiAnalysis?.hazardType ? <Badge tone="neutral">AI suggestion: {titleCase(incident.aiAnalysis.hazardType)}</Badge> : null}</div><p className="whitespace-pre-wrap leading-7 text-slate-700">{incident.description}</p></div></Card>
          <Coordinates incident={incident} />
          <ValidationRoutingSummary incident={incident} />
          <Timeline incident={incident} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden"><CardHeader title="Duplicate candidates" description="Suggestions only; LUNAS never marks a report duplicate automatically." /><div className="divide-y divide-slate-200">{incident.duplicateCandidates.length ? incident.duplicateCandidates.map((candidate) => <div key={candidate.id} className="p-4"><p className="font-semibold text-slate-900">{candidate.reportNumber}</p><p className="mt-1 text-sm text-slate-600">{titleCase(candidate.category)} · {candidate.location?.address.barangay ?? "Location unavailable"}</p><div className="mt-2 flex gap-2">{candidate.distanceMeters !== undefined ? <Badge>{Math.round(candidate.distanceMeters)} m away</Badge> : null}{candidate.score !== undefined ? <Badge tone="warning">Candidate score {Math.round(candidate.score)}</Badge> : null}</div></div>) : <p className="p-4 text-sm text-slate-600">No likely duplicate reports found.</p>}</div></Card>

          <Card className="overflow-hidden"><CardHeader title="Official decision" description={canDecide ? "This action is persisted by the backend and cannot be undone from this screen." : incident.status === "submitted" ? "Your role can review this report but cannot make a validation decision." : "This report has already received an official decision."} />
            {canDecide ? <form onSubmit={submit} className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-2">{(["validate", "reject", "duplicate"] as Decision[]).map((value) => <button key={value} type="button" onClick={() => { setDecision(value); setError(undefined); }} className={`min-h-10 rounded-lg border px-2 text-xs font-bold ${decision === value ? value === "reject" ? "border-red-700 bg-red-700 text-white" : value === "duplicate" ? "border-slate-700 bg-slate-700 text-white" : "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{value === "validate" ? "Validate" : value === "reject" ? "Reject" : "Duplicate"}</button>)}</div>

              {decision === "validate" ? <><label className="block text-sm font-semibold text-slate-800">Priority<select value={priority} onChange={(event) => setPriority(event.target.value as ValidationPriority)} className={fieldClass()}>{priorities.map((value) => <option key={value} value={value}>{titleCase(value)}</option>)}</select></label><Badge tone={priorityTone(priority)}>SLA begins only after validation at this priority.</Badge><label className="block text-sm font-semibold text-slate-800">Confirmed barangay<input value={barangay} onChange={(event) => setBarangay(event.target.value)} className={fieldClass()} maxLength={100} /></label><label className="block text-sm font-semibold text-slate-800">Responsibility<select value={responsibility} onChange={(event) => setResponsibility(event.target.value as Responsibility)} className={fieldClass()}>{responsibilities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="block text-sm font-semibold text-slate-800">Responsible organization<input value={organization} onChange={(event) => setOrganization(event.target.value)} className={fieldClass()} maxLength={160} placeholder="e.g. City Engineering" /></label><label className="block text-sm font-semibold text-slate-800">Routing note <span className="font-normal text-slate-500">(optional)</span><textarea value={routingReason} onChange={(event) => setRoutingReason(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={1000} /></label></> : null}

              {decision === "reject" ? <label className="block text-sm font-semibold text-slate-800">Rejection reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} maxLength={500} required /></label> : null}

              {decision === "duplicate" ? <><label className="block text-sm font-semibold text-slate-800">Canonical report<select value={duplicateOf} onChange={(event) => setDuplicateOf(event.target.value)} className={fieldClass()} required><option value="">Select a likely match</option>{duplicateOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{!duplicateOptions.length ? <label className="block text-sm font-semibold text-slate-800">Canonical report ID<input value={duplicateOf} onChange={(event) => setDuplicateOf(event.target.value)} className={fieldClass()} placeholder="MongoDB report ID" required /></label> : null}<label className="block text-sm font-semibold text-slate-800">Duplicate reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClass()} min-h-24 py-2`} maxLength={500} required /></label></> : null}

              <label className="block text-sm font-semibold text-slate-800">Internal decision note <span className="font-normal text-slate-500">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${fieldClass()} min-h-20 py-2`} maxLength={2000} /></label>
              <Button type="submit" variant={decision === "reject" ? "danger" : "primary"} className="w-full" disabled={pending}>{decision === "validate" ? <><ShieldCheck className="size-4" /> Validate and route</> : decision === "reject" ? <><XCircle className="size-4" /> Reject report</> : <><Route className="size-4" /> Mark duplicate</>}</Button>
            </form> : <div className="p-5 text-sm text-slate-600">No decision controls are available for this report.</div>}
          </Card>
          {canCreateWorkOrder ? <Card className="overflow-hidden"><CardHeader title="Create work order" description="This validated, routed incident is eligible for one primary active work order." /><div className="space-y-4 p-5"><p className="text-sm leading-6 text-slate-600">Creating a work order preserves the citizen report and its evidence, starts repair progress at 0%, and makes the task available for assignment.</p><label className="block text-sm font-semibold text-slate-800">Work instructions <span className="font-normal text-slate-500">(optional)</span><textarea value={workOrderInstructions} onChange={(event) => setWorkOrderInstructions(event.target.value)} maxLength={4000} className={`${fieldClass()} min-h-24 py-2`} placeholder="Add operational instructions for the assigned repair team" /></label><Button type="button" className="w-full" disabled={pending} loading={pending} loadingLabel="Creating…" onClick={createWorkOrder}><ClipboardPlus className="size-4" />Create work order</Button></div></Card> : null}
          {incident.workOrder?.id ? <Card className="overflow-hidden"><CardHeader title="Work order" description="This incident already has its primary maintenance work order." /><div className="p-5"><p className="font-semibold text-slate-950">{incident.workOrder.reference ?? "Work order created"}</p><p className="mt-1 text-sm text-slate-600">{incident.workOrder.progressPercent !== undefined ? `${incident.workOrder.progressPercent}% · ` : ""}{incident.workOrder.status?.replaceAll("_", " ") ?? "Operational status available"}</p><Link href={`/work-orders/${encodeURIComponent(incident.workOrder.id)}`} className="mt-4 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Open work order <Route className="ml-1 size-4" /></Link></div></Card> : null}
        </aside>
      </div>

      <ConfirmationDialog open={confirm} onClose={() => !pending && setConfirm(false)} onConfirm={confirmDecision} loading={pending} icon="none" destructive={decision === "reject"} title={decisionTitle} description={decision === "validate" ? "This will validate the report, persist the selected priority, initialize its SLA deadline, and route it to the responsible organization." : decision === "reject" ? "This will reject the citizen report with the reason entered above." : "This will preserve the report and mark it as a duplicate of the selected canonical incident."} confirmLabel={decisionTitle} />
    </div>
  );
}
