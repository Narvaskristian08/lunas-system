"use client";

/* Signed private evidence URLs are dynamic and intentionally not passed to Next image optimization. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpDown, CalendarDays, ChevronRight, FileImage, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { FilterBar, FilterSelect } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import type { ValidationQueueData, ValidationQueueFilters, ValidationSummary } from "@/lib/validation.server";
import { formatDateTime } from "@/lib/utils";
import type { Severity, UserProfile } from "@/types";

function titleCase(value: string | undefined, fallback = "Not Assigned") {
  if (!value) return fallback;
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function locationLabel(location: ValidationQueueData["incidents"][number]["location"]) {
  const { address } = location;
  return [address.street, address.barangay, address.city].filter(Boolean).join(", ") || "Location pending";
}

function duplicateTone(count: number): Severity {
  return count > 0 ? "warning" : "neutral";
}

function compactDate(value: string | undefined) {
  if (!value) return "Submission time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Submission time unavailable";
  return formatDateTime(value);
}

function confidenceLabel(value: number | undefined) {
  if (value === undefined) return undefined;
  const percentage = value <= 1 ? value * 100 : value;
  return `${Math.round(percentage)}% confidence`;
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: Severity }) {
  const toneClass = {
    warning: "border-amber-200 bg-amber-50 text-amber-950",
    information: "border-blue-200 bg-blue-50 text-blue-950",
    critical: "border-red-200 bg-red-50 text-red-950",
    success: "border-emerald-200 bg-emerald-50 text-emerald-950",
    neutral: "border-slate-200 bg-slate-50 text-slate-950",
  }[tone];
  return (
    <Card className={`border ${toneClass} p-4 shadow-none`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{new Intl.NumberFormat("en-PH").format(value)}</p>
    </Card>
  );
}

export function ValidationQueue({
  viewer,
  queue,
  filters,
  summary,
  summaryUnavailable = false,
}: {
  viewer: UserProfile;
  queue: ValidationQueueData;
  filters: ValidationQueueFilters;
  summary?: ValidationSummary;
  summaryUnavailable?: boolean;
}) {
  const isCityEngineering = viewer.backendRole === "city_engineer";
  const [search, setSearch] = useState(filters.search ?? "");
  const [category, setCategory] = useState(filters.category ?? "");
  const [jurisdiction, setJurisdiction] = useState(filters.jurisdiction ?? "");
  const [duplicate, setDuplicate] = useState(filters.duplicate ?? "");
  const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(filters.dateTo ?? "");
  const [sortBy, setSortBy] = useState<NonNullable<ValidationQueueFilters["sortBy"]>>(filters.sortBy ?? "createdAt_desc");
  const [pending, startTransition] = useTransition();

  const categorySuggestions = useMemo(() => Array.from(new Set([
    ...queue.categories,
    ...queue.incidents.map((incident) => incident.category),
  ])).sort((left, right) => left.localeCompare(right)), [queue.categories, queue.incidents]);
  const jurisdictionSuggestions = useMemo(() => Array.from(new Set([
    ...queue.jurisdictions,
    ...queue.incidents.map((incident) => incident.jurisdiction || incident.location.address.barangay || "").filter(Boolean),
  ])).sort((left, right) => left.localeCompare(right)), [queue.incidents, queue.jurisdictions]);

  const navigate = (next: Partial<ValidationQueueFilters> = {}) => {
    const values: ValidationQueueFilters = {
      page: next.page ?? filters.page,
      limit: next.limit ?? filters.limit,
      search: next.search ?? (search.trim() || undefined),
      category: next.category ?? (category.trim() || undefined),
      jurisdiction: next.jurisdiction ?? (jurisdiction.trim() || undefined),
      duplicate: next.duplicate === undefined ? (duplicate === "yes" || duplicate === "no" ? duplicate : undefined) : next.duplicate,
      dateFrom: next.dateFrom ?? (dateFrom || undefined),
      dateTo: next.dateTo ?? (dateTo || undefined),
      sortBy: next.sortBy ?? sortBy,
    };
    const query = new URLSearchParams();
    if (values.page > 1) query.set("page", String(values.page));
    if (values.limit !== 20) query.set("limit", String(values.limit));
    if (values.search) query.set("search", values.search);
    if (values.category) query.set("category", values.category);
    if (values.jurisdiction) query.set("jurisdiction", values.jurisdiction);
    if (values.duplicate) query.set("duplicate", values.duplicate);
    if (values.dateFrom) query.set("dateFrom", values.dateFrom);
    if (values.dateTo) query.set("dateTo", values.dateTo);
    if (values.sortBy && values.sortBy !== "createdAt_desc") query.set("sortBy", values.sortBy);
    const href = query.size ? `/validation-routing?${query.toString()}` : "/validation-routing";
    startTransition(() => window.history.pushState(null, "", href));
    // Next.js 16 treats browser history calls as router navigations, preserving
    // the server-rendered BFF boundary while making search controls responsive.
  };

  const submitFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ page: 1 });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setJurisdiction("");
    setDuplicate("");
    setDateFrom("");
    setDateTo("");
    setSortBy("createdAt_desc");
    startTransition(() => window.history.pushState(null, "", "/validation-routing"));
  };

  const hasFilters = Boolean(search || category || jurisdiction || duplicate || dateFrom || dateTo || sortBy !== "createdAt_desc");

  return (
    <div className="mx-auto max-w-395">
      <PageHeader
        eyebrow={`${viewer.organization} · Official Workflow`}
        title={isCityEngineering ? "City Engineering Review" : "Barangay Report Review"}
        description={isCityEngineering
          ? "Review incidents forwarded by Barangay Officials, then confirm, request clarification, assign priority, and route to a Utility Provider."
          : "Review citizen reports in your assigned Barangay, inspect their evidence and location, then validate or reject with a reason."}
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Validation" }]}
        actions={<span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600"><ShieldCheck className="size-4 text-brand-700" aria-hidden="true" /> Authorized Scope</span>}
      />

      {summary ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label={isCityEngineering ? "Awaiting Engineering Review" : "Awaiting Review"} value={summary.pending} tone="warning" />
          <SummaryCard label={isCityEngineering ? "City Confirmed" : "Forwarded to City Engineering"} value={summary.validated} tone="information" />
          <SummaryCard label="Rejected" value={summary.rejected} tone="critical" />
          <SummaryCard label="Marked Duplicate" value={summary.duplicate} tone="neutral" />
        </div>
      ) : summaryUnavailable ? (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p><span className="font-semibold">Review summary is temporarily unavailable.</span> The queue below still reflects live reports in your permitted scope.</p>
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader
          title={isCityEngineering ? "Barangay-Validated Incident Queue" : "Citizen Report Queue"}
          description={isCityEngineering
            ? "Only incidents forwarded by Barangay review are returned for City Engineering decisions."
            : "Search and filters are applied by the server; reports outside your assigned Barangay are never returned."}
          action={<span className="text-sm font-medium text-slate-600" aria-live="polite">{pending ? "Updating queue…" : `${queue.pagination.total} report${queue.pagination.total === 1 ? "" : "s"}`}</span>}
        />
        <form onSubmit={submitFilters} noValidate>
          <div className="border-b border-slate-200 bg-slate-50/70 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search reference, description, or location" aria-label="Search Submitted Reports" className="w-full flex-1" disabled={pending} />
              <Button type="submit" variant="secondary" disabled={pending}><Search className="size-4" aria-hidden="true" /> Search</Button>
              {hasFilters ? <Button type="button" variant="ghost" onClick={clearFilters} disabled={pending}>Clear Filters</Button> : null}
            </div>
          </div>

          <FilterBar>
            <label className="min-w-0">
              <span className="sr-only">Category</span>
              <input list="validation-categories" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" className="min-h-10 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" disabled={pending} />
              <datalist id="validation-categories">{categorySuggestions.map((value) => <option key={value} value={value} />)}</datalist>
            </label>
            <label className="min-w-0">
              <span className="sr-only">Barangay or Jurisdiction</span>
              <input list="validation-jurisdictions" value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)} placeholder="Barangay / Jurisdiction" className="min-h-10 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" disabled={pending} />
              <datalist id="validation-jurisdictions">{jurisdictionSuggestions.map((value) => <option key={value} value={value} />)}</datalist>
            </label>
            <FilterSelect label="Possible Duplicate" value={duplicate} onChange={(event) => setDuplicate(event.target.value)} disabled={pending} options={[{ value: "", label: "Any Duplicate State" }, { value: "yes", label: "Possible Duplicate" }, { value: "no", label: "No Duplicate Candidates" }]} />
            <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
              <CalendarDays className="size-4 text-slate-500" aria-hidden="true" />
              <span className="sr-only">From Date</span>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Submitted on or After" className="min-w-0 bg-transparent outline-none" disabled={pending} />
            </label>
            <label className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
              <span className="sr-only">To Date</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Submitted on or Before" className="min-w-0 bg-transparent outline-none" disabled={pending} />
            </label>
            <FilterSelect label="Sort Queue" value={sortBy} onChange={(event) => setSortBy(event.target.value as NonNullable<ValidationQueueFilters["sortBy"]>)} disabled={pending} options={[{ value: "createdAt_desc", label: "Newest Submitted" }, { value: "createdAt_asc", label: "Oldest Submitted" }, { value: "priority_desc", label: "Highest Priority" }]} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}><ArrowUpDown className="size-4" aria-hidden="true" /> Apply</Button>
          </FilterBar>
        </form>

        {queue.incidents.length ? (
          <>
            <DataTable
              caption={isCityEngineering ? "Barangay-validated incidents awaiting City Engineering" : "Citizen reports awaiting Barangay review"}
              columns={[
                { key: "reference", label: "Reference" },
                { key: "evidence", label: "Evidence" },
                { key: "category", label: "Category" },
                { key: "location", label: "Location" },
                { key: "submitted", label: "Submitted" },
                { key: "duplicate", label: "Duplicates" },
                { key: "status", label: "Status" },
                { key: "action", label: "" },
              ]}
              rows={queue.incidents.map((incident) => ({
                id: incident.id,
                cells: {
                  reference: <div><Link href={`/validation-routing/${encodeURIComponent(incident.id)}`} className="font-semibold text-brand-700 hover:underline">{incident.reportNumber}</Link><p className="mt-0.5 max-w-64 truncate text-xs text-slate-500">{incident.description}</p></div>,
                  evidence: incident.evidenceThumbnail ? <span className="block size-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"><img src={incident.evidenceThumbnail} alt={`Evidence supplied with ${incident.reportNumber}`} className="size-full object-cover" /></span> : <span className="flex size-12 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500"><FileImage className="size-5" aria-label="No Evidence Thumbnail Available" /></span>,
                  category: <div><p className="font-medium text-slate-900">{titleCase(incident.category)}</p><p className="mt-0.5 text-xs font-semibold text-brand-700">AI Assistance Only</p><p className="text-xs text-amber-700">Manual review required</p>{incident.aiAnalysis?.hazardType ? <p className="mt-0.5 text-xs text-slate-500">Advisory result: {titleCase(incident.aiAnalysis.hazardType)}{confidenceLabel(incident.aiAnalysis.confidence) ? ` · ${confidenceLabel(incident.aiAnalysis.confidence)}` : ""}</p> : null}</div>,
                  location: <span className="inline-flex max-w-56 items-start gap-1.5"><MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-500" aria-hidden="true" /><span>{locationLabel(incident.location)}</span></span>,
                  submitted: <span className="whitespace-nowrap text-sm text-slate-600">{compactDate(incident.createdAt)}</span>,
                  duplicate: <Badge tone={duplicateTone(incident.duplicateCandidateCount)}>{incident.duplicateCandidateCount ? `${incident.duplicateCandidateCount} candidate${incident.duplicateCandidateCount === 1 ? "" : "s"}` : "None"}</Badge>,
                  status: <StatusBadge tone="warning">{isCityEngineering ? "Barangay validated" : incident.status === "clarification_required" ? "Clarification requested" : "Submitted"}</StatusBadge>,
                  action: <Link href={`/validation-routing/${encodeURIComponent(incident.id)}`} aria-label={`Review ${incident.reportNumber}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-brand-700 hover:bg-brand-50">Review <ChevronRight className="size-4" aria-hidden="true" /></Link>,
                },
              }))}
            />
            <Pagination page={queue.pagination.page} pages={queue.pagination.pages} total={queue.pagination.total} pageSize={queue.pagination.limit} onPageChange={(page) => navigate({ page })} />
          </>
        ) : (
          <EmptyState icon="records" title={hasFilters ? "No reports match these filters" : "No reports awaiting your review"} description={hasFilters ? "Try removing a filter or search term. Scope controls still apply to every result." : isCityEngineering ? "Barangay-validated reports will appear here for City Engineering review." : "Submitted citizen reports in your assigned Barangay will appear here for initial review."} action={hasFilters ? { label: "Clear Filters", onClick: clearFilters } : undefined} />
        )}
      </Card>
    </div>
  );
}
