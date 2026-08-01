"use client";

import Link from "next/link";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileText,
  KeyRound,
  LifeBuoy,
  Paperclip,
  ShieldCheck,
  Siren,
  UserRound,
  WifiOff,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { FormField, SelectField, TextAreaField } from "@/components/forms/form-field";
import { useConnectivity } from "@/components/providers/connectivity-provider";
import { useToast } from "@/components/providers/toast-provider";
import { EmptyState } from "@/components/states/empty-state";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
import {
  frequentlyAskedQuestions,
  supportTopicOptions,
  topicGuides,
  urgencyOptions,
} from "@/components/support/help-content";
import { supportService } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import type { HelpTopic } from "@/types";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

const topicIcons = {
  "getting-started": BookOpen,
  "account-login": KeyRound,
  "reports-incidents": FileText,
  "work-orders": ClipboardCheck,
  sla: Clock3,
  repairs: Wrench,
  notifications: Bell,
  "profile-security": ShieldCheck,
  troubleshooting: CircleHelp,
} as const;

interface SupportFormValues {
  topic: string;
  subject: string;
  description: string;
  relatedRecordId: string;
  urgency: string;
  contactEmail: string;
}

const emptyForm = (contactEmail: string): SupportFormValues => ({
  topic: "",
  subject: "",
  description: "",
  relatedRecordId: "",
  urgency: "normal",
  contactEmail,
});

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentError(file: File) {
  if (!ACCEPTED_ATTACHMENT_TYPES.has(file.type)) {
    return "Choose a PNG, JPG, WEBP, or PDF file.";
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return "The attachment must be 5 MB or smaller.";
  }
  return "";
}

function validate(values: SupportFormValues, attachmentIssue: string) {
  const errors: Partial<Record<keyof SupportFormValues | "attachment", string>> = {};
  if (!values.topic) errors.topic = "Select the topic that best matches your request.";
  if (values.subject.trim().length < 5) errors.subject = "Enter a subject with at least 5 characters.";
  if (values.subject.trim().length > 120) errors.subject = "Keep the subject to 120 characters or fewer.";
  if (values.description.trim().length < 20) errors.description = "Describe the issue in at least 20 characters.";
  if (values.description.trim().length > 2000) errors.description = "Keep the description to 2,000 characters or fewer.";
  if (
    values.relatedRecordId.trim() &&
    !/^(INC|RPT|WO|SLA|REP)-\d{4}-\d{4}$/i.test(values.relatedRecordId.trim())
  ) {
    errors.relatedRecordId = "Use a LUNAS ID such as INC-2026-0087 or WO-2026-0148.";
  }
  if (!/^\S+@\S+\.\S+$/.test(values.contactEmail.trim())) {
    errors.contactEmail = "Enter a valid contact email address.";
  }
  if (attachmentIssue) errors.attachment = attachmentIssue;
  return errors;
}

export function HelpCenter({ topics, contactEmail }: { topics: HelpTopic[]; contactEmail: string }) {
  const { online, checked } = useConnectivity();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState(topics[0]?.id ?? "");
  const [values, setValues] = useState<SupportFormValues>(() => emptyForm(contactEmail));
  const [errors, setErrors] = useState<Partial<Record<keyof SupportFormValues | "attachment", string>>>({});
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentIssue, setAttachmentIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [ticketId, setTicketId] = useState("");
  const attachmentRef = useRef<HTMLInputElement>(null);

  const filteredTopics = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return topics;
    return topics.filter((topic) =>
      [topic.category, topic.title, topic.summary, ...topic.keywords]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, topics]);

  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? filteredTopics[0];

  const update = (field: keyof SupportFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentIssue("");
    setErrors((current) => ({ ...current, attachment: undefined }));
    if (attachmentRef.current) attachmentRef.current.value = "";
  };

  const handleAttachment = (file?: File) => {
    if (!file) {
      clearAttachment();
      return;
    }
    const issue = attachmentError(file);
    setAttachment(file);
    setAttachmentIssue(issue);
    setErrors((current) => ({ ...current, attachment: issue || undefined }));
  };

  const focusFirstError = (formErrors: ReturnType<typeof validate>) => {
    const fieldOrder: Array<keyof typeof formErrors> = [
      "topic",
      "subject",
      "description",
      "relatedRecordId",
      "contactEmail",
      "attachment",
    ];
    const first = fieldOrder.find((field) => formErrors[field]);
    if (!first) return;
    const id = first === "attachment" ? "support-attachment" : `support-${first.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const formErrors = validate(values, attachmentIssue);
    setErrors(formErrors);
    setSubmitError("");
    if (Object.keys(formErrors).length) {
      focusFirstError(formErrors);
      return;
    }
    if (!navigator.onLine) {
      setSubmitError("No internet connection. Your request is still here; reconnect, then submit again.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await supportService.submit({
        topic: values.topic,
        subject: values.subject.trim(),
        description: values.description.trim(),
        relatedRecordId: values.relatedRecordId.trim(),
        urgency: values.urgency,
        contactEmail: values.contactEmail.trim(),
        attachmentName: attachment?.name ?? "",
        attachmentType: attachment?.type ?? "",
        attachmentSizeBytes: attachment ? String(attachment.size) : "",
      });
      setTicketId(result.data.ticketId);
      notify({
        tone: "success",
        title: "Support request received",
        message: `${result.data.ticketId} has been added to the support queue.`,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message === "OFFLINE"
          ? "The connection was lost before submission. Your request is preserved; reconnect and try again."
          : "We couldn’t submit the request. No details were lost. Try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startAnotherRequest = () => {
    setTicketId("");
    setValues(emptyForm(contactEmail));
    setErrors({});
    setSubmitError("");
    clearAttachment();
    requestAnimationFrame(() => document.getElementById("support-topic")?.focus());
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-brand-200 bg-brand-950 text-white shadow-sm">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end lg:px-8 lg:py-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-200">LUNAS knowledge center</p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">How can we help?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Search role-aware guidance for day-to-day command-center tasks, account access, and troubleshooting.
            </p>
            <SearchInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery("")}
              aria-label="Search help topics"
              placeholder="Search reports, work orders, SLA, account access…"
              className="mt-5 max-w-2xl [&_input]:border-white/30 [&_input]:bg-white [&_input]:text-slate-950"
            />
            <p className="mt-2 text-xs text-blue-200" role="status" aria-live="polite">
              {query ? `${filteredTopics.length} ${filteredTopics.length === 1 ? "topic" : "topics"} found` : `${topics.length} help categories available`}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-100">
                <LifeBuoy className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">Need a person?</p>
                <p className="text-xs leading-5 text-blue-100">Send the support team a complete request below.</p>
              </div>
            </div>
            <a href="#contact-support" className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-4 w-full" })}>
              Contact support
            </a>
          </div>
        </div>
      </section>

      <section className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" aria-labelledby="incident-notice-title">
        <Siren className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="incident-notice-title" className="font-semibold">Technical support is not an incident-reporting channel</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Report potholes, leaks, electrical hazards, drainage issues, and other infrastructure concerns through the authorized Reports and Incidents workflow. For immediate danger, follow your agency’s emergency procedure.
          </p>
          <Link href="/dashboard" className="mt-2 inline-flex min-h-10 items-center gap-1 rounded-lg font-semibold text-amber-950 underline decoration-amber-500 underline-offset-4 hover:decoration-amber-800">
            Return to the command center <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="browse-help-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="browse-help-title" className="text-xl font-bold text-slate-950">Browse help topics</h2>
            <p className="mt-1 text-sm text-slate-600">Choose an area to see the most common guidance.</p>
          </div>
          {query ? <Button type="button" variant="ghost" size="sm" onClick={() => setQuery("")}>Clear search</Button> : null}
        </div>

        {filteredTopics.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTopics.map((topic) => {
              const Icon = topicIcons[topic.id as keyof typeof topicIcons] ?? CircleHelp;
              const selected = selectedTopic?.id === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedTopicId(topic.id)}
                  aria-pressed={selected}
                  className={cn(
                    "group min-h-44 rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md",
                    selected ? "border-brand-500 ring-2 ring-brand-100" : "border-slate-200",
                  )}
                >
                  <span className={cn("flex size-11 items-center justify-center rounded-xl", selected ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700")}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="mt-4 block font-semibold text-slate-950">{topic.category}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{topic.summary}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    {topic.articles} articles <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon="search"
              title="No help topics match your search"
              description="Try a shorter phrase such as “SLA,” “password,” “repair,” or “offline.”"
              action={{ label: "Clear search", onClick: () => setQuery("") }}
              size="compact"
            />
          </Card>
        )}

        {selectedTopic && filteredTopics.some((topic) => topic.id === selectedTopic.id) ? (
          <Card className="mt-4 overflow-hidden">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700">Selected guide</p>
                <h3 className="mt-1 text-lg font-bold text-slate-950">{selectedTopic.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{selectedTopic.summary}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  {(topicGuides[selectedTopic.id] ?? []).map((guide) => (
                    <li key={guide} className="flex gap-2 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-700">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                      <span>{guide}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                <p className="font-semibold text-slate-900">Still need assistance?</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">Reference this category when you send a support request.</p>
                <button
                  type="button"
                  onClick={() => {
                    const supportTopic = supportTopicOptions.find((option) => option.value.includes(selectedTopic.id.split("-")[0]))?.value ?? "other";
                    update("topic", supportTopic);
                    document.getElementById("contact-support")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-4 w-full" })}
                >
                  Ask support
                </button>
              </div>
            </div>
          </Card>
        ) : null}
      </section>

      <section aria-labelledby="faq-title">
        <div className="mb-4">
          <h2 id="faq-title" className="text-xl font-bold text-slate-950">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-slate-600">Quick answers to common command-center questions.</p>
        </div>
        <Card className="divide-y divide-slate-200 overflow-hidden">
          {frequentlyAskedQuestions.map((item) => (
            <details key={item.question} className="group px-5 py-1 open:bg-slate-50 sm:px-6">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-slate-900 marker:hidden">
                <span>{item.question}</span>
                <ChevronRight className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true" />
              </summary>
              <p className="max-w-3xl pb-5 text-sm leading-6 text-slate-600">{item.answer}</p>
            </details>
          ))}
        </Card>
      </section>

      <section id="contact-support" className="scroll-mt-28" aria-labelledby="contact-support-title">
        <Card className="overflow-hidden">
          <CardHeader
            title="Contact support"
            description="Send enough context for the LUNAS support team to investigate without including passwords or restricted information."
            action={<span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600"><Clock3 className="size-3.5" aria-hidden="true" /> Response during support hours</span>}
          />
          {ticketId ? (
            <div className="p-5 sm:p-8" role="status" aria-live="polite">
              <div className="mx-auto max-w-xl text-center">
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </span>
                <h2 id="contact-support-title" className="mt-5 text-2xl font-bold text-slate-950">Your request has been received</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The support team will send updates to <span className="font-semibold text-slate-800 break-all">{values.contactEmail}</span>. Keep this reference for follow-up.
                </p>
                <p className="mono mx-auto mt-4 w-fit rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 font-bold text-emerald-900">{ticketId}</p>
                <div className="mt-6 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                  <Link href="/dashboard" className={buttonStyles({ variant: "secondary", size: "md" })}>Return to dashboard</Link>
                  <Button type="button" onClick={startAnotherRequest}>Submit another request</Button>
                </div>
              </div>
            </div>
          ) : (
            <form className="p-5 sm:p-6" noValidate onSubmit={handleSubmit}>
              <h2 id="contact-support-title" className="sr-only">Support request form</h2>
              {checked && !online ? (
                <div className="mb-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="status">
                  <WifiOff className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="font-semibold">No internet connection</p>
                    <p className="mt-0.5 leading-5 text-amber-900">Keep this page open. Your entries are preserved and can be submitted after reconnection.</p>
                  </div>
                </div>
              ) : null}

              {submitError ? (
                <div className="mb-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert" aria-live="assertive">
                  <CircleHelp className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <p>{submitError}</p>
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
                <SelectField
                  id="support-topic"
                  label="Topic"
                  required
                  options={supportTopicOptions}
                  value={values.topic}
                  onChange={(event) => update("topic", event.target.value)}
                  error={errors.topic}
                />
                <SelectField
                  id="support-urgency"
                  label="Urgency"
                  required
                  options={urgencyOptions}
                  value={values.urgency}
                  onChange={(event) => update("urgency", event.target.value)}
                />
                <FormField
                  id="support-subject"
                  label="Subject"
                  required
                  maxLength={120}
                  value={values.subject}
                  onChange={(event) => update("subject", event.target.value)}
                  placeholder="Briefly describe what you need help with"
                  helperText={`${values.subject.length}/120 characters`}
                  error={errors.subject}
                />
                <FormField
                  id="support-related-record-id"
                  label="Related record ID"
                  optional
                  value={values.relatedRecordId}
                  onChange={(event) => update("relatedRecordId", event.target.value.toUpperCase())}
                  placeholder="e.g. INC-2026-0087"
                  helperText="Include an incident, report, work order, SLA, or repair ID when relevant."
                  error={errors.relatedRecordId}
                  inputClassName="mono uppercase"
                />
                <TextAreaField
                  id="support-description"
                  label="Description"
                  required
                  maxLength={2000}
                  value={values.description}
                  onChange={(event) => update("description", event.target.value)}
                  placeholder="What were you trying to do, what happened, and when did it occur?"
                  helperText={`${values.description.length}/2,000 characters. Do not include passwords or authentication codes.`}
                  error={errors.description}
                  className="lg:col-span-2"
                  textareaClassName="min-h-40"
                />
                <FormField
                  id="support-contact-email"
                  type="email"
                  label="Contact email"
                  required
                  value={values.contactEmail}
                  onChange={(event) => update("contactEmail", event.target.value)}
                  helperText="Support updates will be sent to this address."
                  error={errors.contactEmail}
                />
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <label htmlFor="support-attachment" className="text-sm font-semibold text-slate-800">Screenshot or attachment</label>
                    <span className="text-xs text-slate-500">Optional</span>
                  </div>
                  <label
                    htmlFor="support-attachment"
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-white px-3.5 shadow-sm transition hover:border-brand-400 hover:bg-brand-50",
                      errors.attachment ? "border-red-600 ring-3 ring-red-100" : "border-slate-300",
                    )}
                  >
                    <Paperclip className="size-4.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{attachment ? attachment.name : "Choose PNG, JPG, WEBP, or PDF"}</span>
                    <span className="text-xs font-semibold text-brand-700">Browse</span>
                  </label>
                  <input
                    ref={attachmentRef}
                    id="support-attachment"
                    type="file"
                    className="sr-only"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                    onChange={(event) => handleAttachment(event.target.files?.[0])}
                    aria-invalid={Boolean(errors.attachment)}
                    aria-describedby={errors.attachment ? "support-attachment-error" : "support-attachment-help"}
                  />
                  {attachment && !attachmentIssue ? (
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{formatBytes(attachment.size)} · Ready to attach</span>
                      <button type="button" onClick={clearAttachment} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 font-semibold text-slate-700 hover:bg-slate-100">
                        <X className="size-3.5" aria-hidden="true" /> Remove
                      </button>
                    </div>
                  ) : null}
                  {!errors.attachment ? <p id="support-attachment-help" className="mt-1.5 text-xs leading-5 text-slate-500">Maximum file size: 5 MB. Remove unrelated personal or restricted details.</p> : null}
                  {errors.attachment ? <p id="support-attachment-error" className="mt-1.5 text-sm text-red-700" role="alert">{errors.attachment}</p> : null}
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs leading-5 text-slate-500">
                  Submitting creates a support ticket for authorized LUNAS support personnel. Attachments are represented by mock metadata until secure storage is connected.
                </p>
                <Button type="submit" loading={submitting} loadingLabel="Submitting request…" className="w-full shrink-0 sm:w-auto" disabled={checked && !online}>
                  Submit support request
                </Button>
              </div>
            </form>
          )}
        </Card>
      </section>

      <aside className="grid gap-3 sm:grid-cols-2" aria-label="Additional support information">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><UserRound className="size-4.5 text-brand-700" aria-hidden="true" /> Account access</div>
          <p className="mt-1 text-sm leading-5 text-slate-600">For role, organization, suspension, or deactivation changes, contact your organization’s authorized LUNAS administrator.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-900"><ShieldCheck className="size-4.5 text-brand-700" aria-hidden="true" /> Security concern</div>
          <p className="mt-1 text-sm leading-5 text-slate-600">If you notice unexpected account activity, change your password and notify an administrator as soon as possible.</p>
        </div>
      </aside>
    </div>
  );
}
