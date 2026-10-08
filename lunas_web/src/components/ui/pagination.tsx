"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row" aria-label="Pagination">
      <p className="text-sm text-slate-600">Showing <span className="font-semibold text-slate-900">{start}–{end}</span> of <span className="font-semibold text-slate-900">{total}</span></p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous Page"><ChevronLeft className="size-4" aria-hidden="true" /> Previous</Button>
        <span className="px-2 text-sm font-medium text-slate-600" aria-current="page">Page {page} of {Math.max(1, pages)}</span>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)} aria-label="Next Page">Next <ChevronRight className="size-4" aria-hidden="true" /></Button>
      </div>
    </nav>
  );
}
