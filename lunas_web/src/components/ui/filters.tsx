"use client";

import { SlidersHorizontal } from "lucide-react";
import { useId, useState, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({ children, className, activeCount = 0 }: { children: React.ReactNode; className?: string; activeCount?: number }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <div className={cn("flex flex-col gap-3 border-y border-slate-200 bg-slate-50/70 p-4 lg:flex-row lg:items-end", className)}>
      <button type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded(value => !value)} className="flex min-h-11 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 md:hidden">
        <span className="inline-flex items-center gap-2"><SlidersHorizontal className="size-4" aria-hidden="true" /> Filters{activeCount > 0 ? ` (${activeCount})` : ""}</span>
        <span>{expanded ? "Hide" : "Show"}</span>
      </button>
      <div id={contentId} className={cn("min-w-0 flex-1 flex-col flex-wrap items-stretch gap-4 sm:flex-row sm:items-end md:flex", expanded ? "flex" : "hidden")}>
        <span className="hidden w-full items-center gap-2 text-sm font-semibold text-slate-700 md:inline-flex">
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
    <label className={cn("flex w-full min-w-0 flex-col gap-2 text-sm font-semibold text-slate-700 sm:min-w-44 sm:flex-1", className)}>
      <span>{label}</span>
      <select
        className="min-h-11 w-full min-w-0 appearance-auto rounded-xl border border-slate-300 bg-white px-3 pr-8 text-sm font-normal text-slate-900 outline-none focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70"
        aria-label={label}
        {...props}
      >
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export function DateRangeFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <FilterSelect label="Date Range" value={value} onChange={(event) => onChange(event.target.value)} options={[
    { value: "all", label: "Any Date" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
  ]} />;
}

export function SortControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <FilterSelect label="Sort Order" value={value} onChange={(event) => onChange(event.target.value)} options={[
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "priority", label: "Highest Priority" },
  ]} />;
}
