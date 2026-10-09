"use client";

import { categoryLabel } from "@/lib/category-label";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, ClipboardPlus, MapPin } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FilterBar, FilterSelect } from "@/components/ui/filters";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";
import { priorityTone, titleCase } from "@/components/work-orders/work-order-ui";
import type { ProviderIncidentFilters, ProviderIncidentQueueData } from "@/lib/work-orders.server";
import { formatDateTime } from "@/lib/utils";

const categories = ["road", "drainage", "electrical", "water", "gas", "streetlight", "other"];

function locationLabel(incident: ProviderIncidentQueueData["incidents"][number]) {
  return [
    incident.location.address.street,
    incident.location.address.barangay,
    incident.location.address.city,
  ].filter(Boolean).join(", ") || "Location unavailable";
}

function hasFilters(filters: ProviderIncidentFilters) {
  return Boolean(filters.search || filters.priority || filters.category);
}

export function ProviderIncidentQueue({
  queue,
  filters,
  embedded = false,
}: {
  queue: ProviderIncidentQueueData;
  filters: ProviderIncidentFilters;
  embedded?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(filters.search ?? "");

  const navigate = (patch: Record<string, string | undefined>) => {
    const values: Record<string, string | undefined> = {
      search: filters.search,
      priority: filters.priority,
      category: filters.category,
      sortBy: filters.sortBy,
      limit: String(filters.limit),
      page: String(filters.page),
      ...patch,
    };
    if (!Object.prototype.hasOwnProperty.call(patch, "page")) values.page = "1";
    const query = new URLSearchParams();
    if (embedded) query.set("assignmentStatus", "unassigned");
    for (const [key, value] of Object.entries(values)) {
      if (value) query.set(key, value);
    }
    router.push(`${pathname}?${query.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    navigate({ search: undefined, priority: undefined, category: undefined, sortBy: "newest" });
  };

  return (
    <div className={embedded ? "w-full" : "mx-auto max-w-6xl"}>
      {!embedded ? <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-normal text-brand-700">Maintenance Operations · Provider Intake</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">Routed Incidents</h1>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
            Incidents routed by City Engineering to your organization appear here. Create the initial work order, then assign eligible repair personnel.
          </p>
        </div>
        <Link href="/work-orders" className={buttonStyles({ variant: "secondary" })}>Open Work Orders</Link>
      </div> : null}

      <Card className="overflow-hidden">
        <CardHeader
          title={embedded ? "Reports Awaiting Work Order" : "Organization Intake Queue"}
          description={`${queue.pagination.total} routed ${queue.pagination.total === 1 ? "incident" : "incidents"} in your authorized organization scope.`}
          action={<StatusBadge tone="information">Provider assigned</StatusBadge>}
        />
        <form
          className="border-b border-slate-200 bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ search: search.trim() || undefined });
          }}
        >
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => { setSearch(""); navigate({ search: undefined }); }}
            placeholder="Search report number or description"
            aria-label="Search Routed Incidents"
            className="max-w-xl"
          />
        </form>
        <FilterBar>
          <FilterSelect
            label="Priority"
            value={filters.priority ?? ""}
            onChange={(event) => navigate({ priority: event.target.value || undefined })}
            options={[
              { value: "", label: "All Priorities" },
              { value: "critical", label: "Critical" },
              { value: "high", label: "High" },
              { value: "medium", label: "Medium" },
              { value: "low", label: "Low" },
            ]}
          />
          <FilterSelect
            label="Category"
            value={filters.category ?? ""}
            onChange={(event) => navigate({ category: event.target.value || undefined })}
            options={[
              { value: "", label: "All Categories" },
              ...categories.map((category) => ({ value: category, label: categoryLabel(category) })),
            ]}
          />
          <FilterSelect
            label="Sort Incidents"
            value={filters.sortBy ?? "newest"}
            onChange={(event) => navigate({ sortBy: event.target.value || "newest" })}
            options={[
              { value: "newest", label: "Newest Reports" },
              { value: "oldest", label: "Oldest Reports" },
              { value: "priority", label: "Priority" },
            ]}
          />
          {hasFilters(filters) ? (
            <button type="button" onClick={clearFilters} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">
              Clear Filters
            </button>
          ) : null}
        </FilterBar>

        {queue.incidents.length ? (
          <>
            <div className="divide-y divide-slate-200">
              {queue.incidents.map((incident) => (
                <article key={incident.id} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/work-orders/intake/${encodeURIComponent(incident.id)}`} className="font-bold text-brand-700 hover:underline">
                        {incident.reportNumber}
                      </Link>
                      {incident.priority ? <Badge tone={priorityTone(incident.priority)}>{titleCase(incident.priority)}</Badge> : null}
                      <Badge tone="neutral">{categoryLabel(incident.category, "Uncategorized")}</Badge>
                      {incident.workOrder ? <StatusBadge tone="success">Work order created</StatusBadge> : <StatusBadge tone="warning">Ready for work order</StatusBadge>}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">{incident.description ?? "No incident description available."}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{locationLabel(incident)}</span>
                      <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" aria-hidden="true" />{incident.responsibleOrganization ?? "Assigned organization"}</span>
                      {incident.routedAt ? <span>Routed {formatDateTime(incident.routedAt)}</span> : null}
                    </div>
                  </div>
                  {incident.workOrder ? (
                    <Link href={`/work-orders/${encodeURIComponent(incident.workOrder.id)}`} className={buttonStyles({ variant: "secondary", className: "whitespace-nowrap" })}>
                      Assign personnel <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link href={`/work-orders/intake/${encodeURIComponent(incident.id)}`} className={buttonStyles({ className: "whitespace-nowrap" })}>
                      <ClipboardPlus className="size-4" aria-hidden="true" /> Review and Create
                    </Link>
                  )}
                </article>
              ))}
            </div>
            <Pagination
              page={queue.pagination.page}
              pages={queue.pagination.pages}
              total={queue.pagination.total}
              pageSize={queue.pagination.limit}
              onPageChange={(page) => navigate({ page: String(page) })}
            />
          </>
        ) : (
          <EmptyState
            icon={hasFilters(filters) ? "search" : "records"}
            title={hasFilters(filters) ? "No routed incidents match these filters" : "No incidents awaiting provider intake"}
            description={hasFilters(filters)
              ? "Try removing a filter or search term. Organization scope remains enforced by the backend."
              : "Incidents will appear after City Engineering prioritizes and routes them to your Utility Provider organization."}
            action={hasFilters(filters) ? { label: "Clear Filters", onClick: clearFilters } : undefined}
          />
        )}
      </Card>
    </div>
  );
}
