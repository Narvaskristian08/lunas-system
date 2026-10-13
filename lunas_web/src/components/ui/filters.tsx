"use client";

import { CalendarDays, ListFilter, SlidersHorizontal } from "lucide-react";
import { useId, useState, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({ children, className, activeCount = 0 }: { children: React.ReactNode; className?: string; activeCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <div className={cn("flex flex-col gap-3 border-y border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-center", className)}>
      <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(value => !value)} className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 md:hidden">
        <span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4" aria-hidden="true" /> Filters{activeCount > 0 ? ` (${activeCount})` : ""}</span>
        <span>{expanded ? "Hide" : "Show"}</span>
      </button>
      <div id={contentId} className={cn("min-w-0 flex-1 flex-wrap items-center gap-2 md:flex", expanded ? "flex" : "hidden")}>
        <span className="mr-1 hidden items-center gap-2 text-sm font-semibold text-slate-700 md:inline-flex">
          <SlidersHorizontal className="size-4" aria-hidden="true" /> Filters
        </span>
        {children}
      </div>
    </div>
  );
}

export function FilterSelect({
  label,
  options,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className={cn("relative min-w-0", className)}>
      <span className="sr-only">{label}</span>
      <select
        className="min-h-10 max-w-full appearance-auto rounded-lg border border-slate-300 bg-white px-3 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70"
        aria-label={label}
        {...props}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function DateRangeFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">Date Range</span>
      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 appearance-auto rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" aria-label="Date Range">
        <option value="all">Any Date</option>
        <option value="today">Today</option>
        <option value="week">Last 7 Days</option>
        <option value="month">Last 30 Days</option>
      </select>
    </label>
  );
}

export function SortControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">Sort Notifications</span>
      <ListFilter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 appearance-auto rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-sm font-medium text-slate-700 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70" aria-label="Sort Order">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="priority">Highest Priority</option>
      </select>
    </label>
  );
}
