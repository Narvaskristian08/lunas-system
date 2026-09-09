"use client";

/* Signed evidence URLs are supplied by the protected API and should not be optimized by Next image. */
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileImage,
  MapPin,
  Play,
  Route,
  Upload,
  UserRoundCheck,
  UsersRound,
  Wrench,
  XCircle,
} from "lucide-react";
import {
  acceptWorkOrderAction,
  assignWorkOrderAction,
  declineWorkOrderAction,
  reassignWorkOrderAction,
  startWorkOrderAction,
  updateRepairProgressAction,
  uploadRepairEvidenceAction,
  type WorkOrderActionResult,
} from "@/app/actions/work-orders";
import { Breadcrumbs, PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/providers/toast-provider";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type { UserProfile } from "@/types";
import type { EligibleRepairPersonnel, WorkOrder } from "@/lib/work-orders.server";
import { repairProgressStages } from "@/lib/work-order-progress";
import { cn, formatDateTime } from "@/lib/utils";
import {
  assignmentTone,
  formatLocation,
  formatPerson,
  formatRemaining,
  priorityTone,
  ProgressBar,
  SlaBadges,
  titleCase,
  workOrderStatusTone,
} from "@/components/work-orders/work-order-ui";

const officialRoles = new Set(["barangay_official", "city_engineer", "utility_provider", "admin"]);
const progressValues = [25, 50, 75, 100] as const;

function alertClass(kind: "success" | "error") {
  return kind === "success"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : "border-red-200 bg-red-50 text-red-950";
}

function ActionNotice({ message, kind }: { message?: string; kind?: "success" | "error" }) {
  if (!message || !kind) return null;
  const Icon = kind === "success" ? CheckCircle2 : AlertTriangle;
  return <div role={kind === "error" ? "alert" : "status"} className={cn("mb-5 flex gap-3 rounded-xl border p-4 text-sm", alertClass(kind))}><Icon className="size-5 shrink-0" aria-hidden="true" />{message}</div>;
}

function personName(person: EligibleRepairPersonnel) {
  return formatPerson(person.firstName, person.lastName, "Eligible repair personnel");
}

function AssignmentPanel({
  workOrder,
  eligiblePersonnel,
  onResult,
}: {
  workOrder: WorkOrder;
  eligiblePersonnel: EligibleRepairPersonnel[];
  onResult: (result: WorkOrderActionResult) => void;
}) {
  const [assigneeId, setAssigneeId] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const hasAssignment = Boolean(workOrder.currentAssignment || workOrder.assignee);
  const canChangeAssignment = workOrder.status !== "completed";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assigneeId || !canChangeAssignment) return;
    if (hasAssignment && !reason.trim()) return;
    startTransition(async () => {
      const result = hasAssignment
        ? await reassignWorkOrderAction({ workOrderId: workOrder.id, assigneeId, reason })
        : await assignWorkOrderAction({ workOrderId: workOrder.id, assigneeId });
      onResult(result);
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Assignment" description="Only backend-eligible active repair personnel are available for selection." />
      <div className="space-y-4 p-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current assignee</p>
              <p className="mt-1 font-semibold text-slate-950">{formatPerson(workOrder.assignee?.firstName, workOrder.assignee?.lastName)}</p>
              {workOrder.assignee?.team ? <p className="mt-1 text-sm text-slate-600">{workOrder.assignee.team}</p> : null}
            </div>
            <StatusBadge tone={assignmentTone(workOrder.assignmentState)}>{titleCase(workOrder.assignmentState)}</StatusBadge>
          </div>
          {workOrder.currentAssignment?.assignedAt ? <p className="mt-3 text-xs text-slate-600">Assigned {formatDateTime(workOrder.currentAssignment.assignedAt)}</p> : null}
          {workOrder.currentAssignment?.declineReason ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900"><span className="font-semibold">Declined:</span> {workOrder.currentAssignment.declineReason}</p> : null}
        </div>

        {canChangeAssignment ? <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-semibold text-slate-800">{hasAssignment ? "Reassign to" : "Assign repair personnel"}
            <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70">
              <option value="">Select eligible personnel</option>
              {eligiblePersonnel.map((person) => <option key={person.id} value={person.id}>{personName(person)}{person.team ? ` · ${person.team}` : ""}{person.availability ? ` · ${titleCase(person.availability)}` : ""}</option>)}
            </select>
          </label>
          {hasAssignment ? <label className="block text-sm font-semibold text-slate-800">Reassignment reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={2} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Explain why this assignment must change" />
          </label> : null}
          {eligiblePersonnel.length ? <Button type="submit" className="w-full" loading={pending} loadingLabel={hasAssignment ? "Reassigning…" : "Assigning…"}><UsersRound className="size-4" aria-hidden="true" />{hasAssignment ? "Reassign work order" : "Assign work order"}</Button> : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-600">No eligible repair personnel are currently available for this work order. Availability and organization scope are determined by the backend.</p>}
        </form> : <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">This repair reached 100% and is ready for formal completion and verification. Assignment changes are no longer available in this milestone.</p>}
      </div>
    </Card>
  );
}

function RepairActions({ workOrder, onResult }: { workOrder: WorkOrder; onResult: (result: WorkOrderActionResult) => void }) {
  const [declineReason, setDeclineReason] = useState("");
  const [declineNotes, setDeclineNotes] = useState("");
  const [progressPercent, setProgressPercent] = useState<25 | 50 | 75 | 100>(() => progressValues.find((value) => value > workOrder.progressPercent) ?? 100);
  const [progressNotes, setProgressNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [confirmStart, setConfirmStart] = useState(false);
  const canAccept = workOrder.status === "pending" && workOrder.assignmentState === "pending";
  const canStart = workOrder.status === "accepted" && workOrder.assignmentState === "accepted";
  const canProgress = workOrder.status === "in_progress" && workOrder.assignmentState === "accepted";
  const nextValues = progressValues.filter((value) => value > workOrder.progressPercent);

  const run = (operation: () => Promise<WorkOrderActionResult>) => {
    startTransition(async () => onResult(await operation()));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Field repair actions" description="Actions apply only to the currently assigned repair personnel and are revalidated by the API." />
      <div className="space-y-4 p-5">
        {canAccept ? <div className="grid gap-2 sm:grid-cols-2"><Button type="button" loading={pending} onClick={() => run(() => acceptWorkOrderAction(workOrder.id))}><UserRoundCheck className="size-4" />Accept assignment</Button><Button type="button" variant="secondary" onClick={() => document.getElementById("decline-assignment")?.focus()} disabled={pending}><XCircle className="size-4" />Decline assignment</Button></div> : null}

        {canAccept ? <form onSubmit={(event) => { event.preventDefault(); if (!declineReason.trim()) return; run(() => declineWorkOrderAction({ workOrderId: workOrder.id, reason: declineReason, notes: declineNotes })); }} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-sm font-semibold text-slate-800">Decline reason
            <textarea id="decline-assignment" value={declineReason} onChange={(event) => setDeclineReason(event.target.value)} required minLength={2} maxLength={500} className="mt-1 min-h-20 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Required — for example, workload conflict or equipment issue" />
          </label>
          <label className="block text-sm font-semibold text-slate-800">Additional notes <span className="font-normal text-slate-500">(optional)</span>
            <textarea value={declineNotes} onChange={(event) => setDeclineNotes(event.target.value)} maxLength={2000} className="mt-1 min-h-16 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" />
          </label>
          <Button type="submit" variant="danger" className="w-full" loading={pending} loadingLabel="Declining…">Submit decline</Button>
        </form> : null}

        {canStart ? <Button type="button" className="w-full" loading={pending} loadingLabel="Starting…" onClick={() => setConfirmStart(true)}><Play className="size-4" />Start repair work</Button> : null}

        {canProgress ? <form onSubmit={(event) => { event.preventDefault(); run(() => updateRepairProgressAction({ workOrderId: workOrder.id, progressPercent, notes: progressNotes })); }} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-950">Update repair progress</p><Badge tone="information">Current: {workOrder.progressPercent}%</Badge></div>
          <label className="block text-sm font-semibold text-slate-800">New progress
            <select value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value) as 25 | 50 | 75 | 100)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70">
              {nextValues.map((value) => <option key={value} value={value}>{value}% · {titleCase(repairProgressStages[value])}</option>)}
            </select>
          </label>
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">Repair stage is set centrally to <strong>{titleCase(repairProgressStages[progressPercent])}</strong>. Progress cannot move backward.</p>
          <label className="block text-sm font-semibold text-slate-800">Progress note {progressPercent === 100 ? <span className="text-red-700">(required at 100%)</span> : <span className="font-normal text-slate-500">(optional)</span>}
            <textarea value={progressNotes} onChange={(event) => setProgressNotes(event.target.value)} required={progressPercent === 100} minLength={progressPercent === 100 ? 2 : undefined} maxLength={2000} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="Describe field conditions or work completed" />
          </label>
          <Button type="submit" className="w-full" loading={pending} loadingLabel="Saving progress…"><Wrench className="size-4" />{progressPercent === 100 ? "Mark ready for completion" : "Save progress update"}</Button>
        </form> : null}

        {workOrder.status === "completed" ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-semibold">Ready for Completion / Verification</p><p className="mt-1">Field repair reached 100%. Formal submission, verification, approval, rework, and closure are intentionally deferred to the 100% milestone.</p></div> : null}
        {!canAccept && !canStart && !canProgress && workOrder.status !== "completed" ? <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">This work order is waiting for its next controlled assignment or repair transition.</p> : null}
      </div>
      <ConfirmationDialog open={confirmStart} icon="none" title="Start repair work" description="This records the start time and changes the work order to in progress. It does not complete or verify the repair." confirmLabel="Start work" loading={pending} onClose={() => !pending && setConfirmStart(false)} onConfirm={() => { setConfirmStart(false); run(() => startWorkOrderAction(workOrder.id)); }} />
    </Card>
  );
}

function RepairEvidenceUpload({ workOrder, onResult }: { workOrder: WorkOrder; onResult: (result: WorkOrderActionResult) => void }) {
  const [pending, startTransition] = useTransition();
  const [selectedCount, setSelectedCount] = useState(0);
  const canUpload = workOrder.status === "in_progress" && workOrder.assignmentState === "accepted";
  if (!canUpload) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader title="Add field evidence" description="JPEG, PNG, or WebP images; upload confirmation comes from the server." />
      <form onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        startTransition(async () => {
          const result = await uploadRepairEvidenceAction(formData);
          if (result.ok) form.reset();
          setSelectedCount(0);
          onResult(result);
        });
      }} className="space-y-3 p-5">
        <input type="hidden" name="workOrderId" value={workOrder.id} />
        <label className="block text-sm font-semibold text-slate-800">Evidence images
          <input name="evidence" type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => setSelectedCount(event.currentTarget.files?.length ?? 0)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-800 hover:file:bg-brand-100" required />
        </label>
        <p className="text-xs leading-5 text-slate-600">{selectedCount ? `${selectedCount} image${selectedCount === 1 ? "" : "s"} selected.` : "Up to five images, 10 MB each. EXIF/privacy processing and storage validation happen on the backend."}</p>
        <label className="block text-sm font-semibold text-slate-800">Caption <span className="font-normal text-slate-500">(optional)</span>
          <input name="caption" maxLength={500} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" placeholder="What this field evidence shows" />
        </label>
        <Button type="submit" variant="secondary" className="w-full" loading={pending} loadingLabel="Uploading…"><Upload className="size-4" />Upload evidence</Button>
      </form>
    </Card>
  );
}

function EvidenceGallery({ title, description, evidence }: { title: string; description: string; evidence: WorkOrder["evidence"] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader title={title} description={description} />
      {evidence.length ? <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{evidence.map((item, index) => <div key={`${item.id}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        {item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="block aspect-[4/3] bg-slate-100"><img src={item.url} alt={`${title} ${index + 1}`} className="size-full object-cover" /></a> : <div className="flex aspect-[4/3] items-center justify-center text-slate-500"><FileImage className="size-8" aria-hidden="true" /></div>}
        <div className="space-y-1 border-t border-slate-200 px-3 py-2.5 text-xs text-slate-600">{item.caption ? <p>{item.caption}</p> : null}{item.uploadedAt ? <p>Uploaded {formatDateTime(item.uploadedAt)}</p> : null}{item.mimeType ? <p>{item.mimeType}</p> : null}</div>
      </div>)}</div> : <p className="p-5 text-sm text-slate-600">No {title.toLowerCase()} uploaded yet.</p>}
    </Card>
  );
}

function WorkOrderTimeline({ workOrder }: { workOrder: WorkOrder }) {
  const events = useMemo(() => [...workOrder.history].sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? "")), [workOrder.history]);
  return (
    <Card className="overflow-hidden">
      <CardHeader title="Operational timeline" description="Append-oriented work-order events returned by the backend." />
      {events.length ? <ol className="divide-y divide-slate-200">{events.map((entry) => <li key={entry.id} className="flex gap-3 px-5 py-4"><span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-brand-700" aria-hidden="true" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{entry.type === "ready_for_completion" ? "Repair reached 100%" : titleCase(entry.type ?? entry.status, "Work-order update")}</p>{entry.progressPercent !== undefined ? <Badge tone={entry.progressPercent === 100 ? "success" : "information"}>{entry.progressPercent}%</Badge> : null}</div>{entry.stage ? <p className="mt-1 text-xs font-semibold text-slate-500">{titleCase(entry.stage)}</p> : null}{entry.notes ? <p className="mt-1 text-sm leading-6 text-slate-600">{entry.notes}</p> : null}{entry.createdAt ? <p className="mt-1.5 text-xs text-slate-500">{formatDateTime(entry.createdAt)}</p> : null}</div></li>)}</ol> : <p className="p-5 text-sm text-slate-600">No work-order events are available yet.</p>}
    </Card>
  );
}

export function WorkOrderDetail({
  viewer,
  workOrder,
  eligiblePersonnel = [],
}: {
  viewer: UserProfile;
  workOrder: WorkOrder;
  eligiblePersonnel?: EligibleRepairPersonnel[];
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [notice, setNotice] = useState<{ message: string; kind: "success" | "error" }>();
  const official = officialRoles.has(viewer.backendRole) && viewer.permissions.includes("work_orders.manage");
  const repairAssignee = viewer.backendRole === "repair_personnel" && workOrder.assignee?.id === viewer.id;
  const incidentLocation = workOrder.incident?.location;
  const [longitude, latitude] = incidentLocation?.coordinates ?? [];
  const mapsHref = typeof longitude === "number" && typeof latitude === "number"
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`
    : undefined;
  const result = (actionResult: WorkOrderActionResult) => {
    const kind = actionResult.ok ? "success" : "error";
    setNotice({ message: actionResult.message, kind });
    notify({ title: actionResult.ok ? "Work order updated" : "Action not completed", message: actionResult.message, tone: kind === "success" ? "success" : "error" });
    if (actionResult.ok || actionResult.conflict) router.refresh();
  };

  return (
    <div className="mx-auto max-w-[1480px]">
      <Breadcrumbs items={[{ label: "Work orders", href: "/work-orders" }, { label: workOrder.reference }]} />
      <PageHeader
        eyebrow={`${workOrder.responsibleOrganization ?? "Maintenance"} · ${workOrder.jurisdiction?.barangay ?? "Authorized scope"}`}
        title={workOrder.reference}
        description={workOrder.incident?.category ? `${titleCase(workOrder.incident.category)} repair work order` : "Maintenance work order"}
        actions={<><StatusBadge tone={workOrderStatusTone(workOrder.status)}>{workOrder.status === "completed" ? "Ready for completion" : titleCase(workOrder.status)}</StatusBadge><StatusBadge tone={priorityTone(workOrder.priority)}>{titleCase(workOrder.priority)}</StatusBadge></>}
      />
      <ActionNotice message={notice?.message} kind={notice?.kind} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Repair progress</p><ProgressBar value={workOrder.progressPercent} className="mt-3" /><p className="mt-2 text-sm font-semibold text-slate-900">{titleCase(workOrder.progressStage)}</p></Card>
        <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assignment</p><p className="mt-2 font-semibold text-slate-950">{formatPerson(workOrder.assignee?.firstName, workOrder.assignee?.lastName)}</p><StatusBadge className="mt-2" tone={assignmentTone(workOrder.assignmentState)}>{titleCase(workOrder.assignmentState)}</StatusBadge></Card>
        <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">SLA deadline</p>{workOrder.sla.deadline ? <><p className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(workOrder.sla.deadline)}</p><p className="mt-1 text-xs text-slate-600">{formatRemaining(workOrder.sla.remainingMilliseconds) ?? "Deadline supplied by backend"}</p></> : <p className="mt-2 text-sm text-slate-600">No deadline returned</p>}</Card>
        <Card className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">SLA state</p><div className="mt-2"><SlaBadges sla={workOrder.sla} /></div><p className="mt-2 text-xs text-slate-600">State is calculated by the backend.</p></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader title="Incident and work-order information" description="The citizen report remains separate from the maintenance task." />
            <dl className="grid divide-y divide-slate-200 text-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-5"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Incident reference</dt><dd className="mt-1.5 font-semibold text-slate-950">{workOrder.incident?.reportNumber ?? "Unavailable"}</dd></div>
              <div className="p-5"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Responsible organization</dt><dd className="mt-1.5 font-semibold text-slate-950">{workOrder.responsibleOrganization ?? "Not routed"}</dd></div>
              <div className="p-5"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Location</dt><dd className="mt-1.5 leading-6 text-slate-800">{formatLocation(incidentLocation)}</dd>{mapsHref ? <a href={mapsHref} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><MapPin className="size-3.5" />Open directions <ExternalLink className="size-3.5" /></a> : null}</div>
              <div className="p-5"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Created</dt><dd className="mt-1.5 text-slate-800">{workOrder.createdAt ? formatDateTime(workOrder.createdAt) : "Unavailable"}</dd>{workOrder.startedAt ? <p className="mt-3 text-xs text-slate-600">Started {formatDateTime(workOrder.startedAt)}</p> : null}</div>
              <div className="p-5 sm:col-span-2"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Work instructions</dt><dd className="mt-1.5 whitespace-pre-wrap leading-6 text-slate-800">{workOrder.instructions ?? "No additional work instructions were provided."}</dd></div>
            </dl>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader title="Citizen report" description="Only repair-relevant report information is shown." />
            <div className="space-y-4 p-5"><div className="flex flex-wrap gap-2"><Badge tone="information">{titleCase(workOrder.incident?.category, "Uncategorized")}</Badge>{workOrder.incident?.priority ? <Badge tone={priorityTone(workOrder.incident.priority)}>{titleCase(workOrder.incident.priority)}</Badge> : null}</div><p className="whitespace-pre-wrap leading-7 text-slate-700">{workOrder.incident?.description ?? "No citizen description is available."}</p></div>
          </Card>

          <EvidenceGallery title="Citizen evidence" description="Signed, privacy-processed evidence URLs are supplied by the protected API." evidence={workOrder.incident?.images ?? []} />
          <EvidenceGallery title="Repair field evidence" description="Traceable maintenance evidence uploaded during repair progress." evidence={workOrder.evidence} />
          <WorkOrderTimeline workOrder={workOrder} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden"><CardHeader title="SLA monitoring" description="The API is the source of truth for deadline state." /><div className="space-y-4 p-5"><SlaBadges sla={workOrder.sla} includeDeadline />{workOrder.sla.targetResolutionTime ? <p className="text-sm text-slate-700">Target: {workOrder.sla.targetResolutionTime} hours</p> : null}{workOrder.sla.isApproaching ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950"><Clock3 className="mr-1 inline size-4" /> Deadline is approaching. Keep the responsible organization and assigned team informed.</p> : null}{workOrder.sla.isOverdue ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-950"><AlertTriangle className="mr-1 inline size-4" /> This work order is overdue. It remains open and is not automatically closed or rejected.</p> : null}</div></Card>
          {official ? <AssignmentPanel workOrder={workOrder} eligiblePersonnel={eligiblePersonnel} onResult={result} /> : null}
          {repairAssignee ? <><RepairActions workOrder={workOrder} onResult={result} /><RepairEvidenceUpload workOrder={workOrder} onResult={result} /></> : null}
          <Card className="overflow-hidden"><CardHeader title="Assignment history" description="Previous assignments remain available for audit and reassignment context." />{workOrder.assignments.length ? <ol className="divide-y divide-slate-200">{workOrder.assignments.map((assignment) => <li key={assignment.id} className="p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-900">{formatPerson(assignment.assignee?.firstName, assignment.assignee?.lastName)}</p><StatusBadge tone={assignmentTone(assignment.status)}>{titleCase(assignment.status)}</StatusBadge></div>{assignment.assignedAt ? <p className="mt-1 text-xs text-slate-600">Assigned {formatDateTime(assignment.assignedAt)}</p> : null}{assignment.endedAt ? <p className="mt-1 text-xs text-slate-600">Ended {formatDateTime(assignment.endedAt)}</p> : null}{assignment.declineReason ? <p className="mt-2 text-sm leading-6 text-red-800">Decline reason: {assignment.declineReason}</p> : null}{assignment.endedReason ? <p className="mt-2 text-sm leading-6 text-slate-600">Reassignment: {assignment.endedReason}</p> : null}</li>)}</ol> : <p className="p-5 text-sm text-slate-600">No assignment history is available yet.</p>}</Card>
          <Link href="/work-orders" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"><Route className="size-4" />Return to work orders<ChevronRight className="size-4" /></Link>
        </aside>
      </div>
    </div>
  );
}
