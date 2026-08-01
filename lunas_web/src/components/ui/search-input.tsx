"use client";

import { Search, X } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  onClear,
  className,
  "aria-label": ariaLabel = "Search",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { onClear?: () => void }) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        className="min-h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70"
        {...props}
      />
      {value && onClear ? (
        <button type="button" onClick={onClear} className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Clear search">
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
