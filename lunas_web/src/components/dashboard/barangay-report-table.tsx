"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { SearchInput } from "@/components/ui/search-input";

export function BarangayReportTable({ rows }: { rows: Array<{ barangay: string; reports: number }> }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("highest");
  const visible = rows.filter(row => row.barangay.toLowerCase().includes(search.trim().toLowerCase()) && (filter === "with" ? row.reports > 0 : filter === "zero" ? row.reports === 0 : true))
    .toSorted((a, b) => (sort === "highest" ? b.reports - a.reports : sort === "lowest" ? a.reports - b.reports : 0) || a.barangay.localeCompare(b.barangay));
  return <Card className="mb-6 overflow-hidden">
    <CardHeader title="Reports by Barangay" description="Report totals across all 31 barangays in your authorized scope." />
    <div className="grid items-end gap-3 border-b border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_200px_200px_auto]">
      <div><label htmlFor="barangay-search" className="mb-1.5 block text-xs font-medium text-slate-600">Find a Barangay</label><SearchInput id="barangay-search" value={search} onChange={event => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search barangay name" /></div>
      <label className="block text-xs font-medium text-slate-600">Report Count<select value={filter} onChange={event => setFilter(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-2 focus:outline-brand-600"><option value="all">All Barangays</option><option value="with">With Reports</option><option value="zero">No Reports</option></select></label>
      <label className="block text-xs font-medium text-slate-600">Sort By<select value={sort} onChange={event => setSort(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:outline-2 focus:outline-brand-600"><option value="highest">Most Reports</option><option value="lowest">Fewest Reports</option><option value="name">Barangay Name</option></select></label>
      <button type="button" onClick={() => { setSearch(""); setFilter("all"); setSort("highest"); }} disabled={!search && filter === "all" && sort === "highest"} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:text-slate-400">Reset</button>
    </div>
    <DataTable key={`${search}-${filter}-${sort}`} caption="Barangay report counts" className="max-h-[460px] overflow-auto [&_table]:min-w-0 [&_table]:table-fixed [&_td]:py-3 [&_thead]:bg-slate-50 [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_th:last-child]:text-right [&_td:last-child]:text-right [&_td:last-child]:font-semibold [&_td:last-child]:tabular-nums" columns={[{ key: "barangay", label: "Barangay", className: "w-2/3" }, { key: "reports", label: "Reports" }]} rows={visible.map(row => ({ id: row.barangay, cells: { barangay: <span className="font-medium text-slate-900">{row.barangay}</span>, reports: <span className={`tabular-nums ${row.reports ? "text-slate-900" : "text-slate-400"}`}>{row.reports.toLocaleString("en-PH")}</span> } }))} />
    {!visible.length ? <p className="p-5 text-sm text-slate-500">No barangays match this filter.</p> : null}
    <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Showing {visible.length} of {rows.length} barangays</div>
  </Card>;
}
