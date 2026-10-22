import { reportCategorySummary, type ExportReport } from "@/lib/report-export";

export function CategorySummary({ reports, period, date }: { reports: ExportReport[]; period: string; date?: string }) {
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <form className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="period" value={period} />
      <label className="text-sm font-semibold">Choose a date within the reporting period<input type="date" name="date" defaultValue={date} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" required /></label>
      <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Generate report</button>
    </form>
    <table className="w-full text-left text-sm"><caption className="mb-3 text-left font-semibold">Incidents by category</caption><thead><tr><th className="p-2">Category</th><th className="p-2">Total incidents</th></tr></thead><tbody>{reportCategorySummary(reports).map(row => <tr key={row.code} className="border-t border-slate-100"><td className="p-2">{row.label}</td><td className="p-2">{row.total}</td></tr>)}</tbody><tfoot><tr className="border-t font-semibold"><th className="p-2">Total</th><td className="p-2">{reports.length}</td></tr></tfoot></table>
  </section>;
}
