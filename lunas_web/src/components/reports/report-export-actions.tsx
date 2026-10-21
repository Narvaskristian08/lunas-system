import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { reportRange, type ReportPeriod } from "@/lib/report-export";

export function ReportExportActions({ basePath, period }: { basePath: string; period: ReportPeriod }) {
  const href = `${basePath}/export?period=${period}`;
  const range = reportRange(period);
  return <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Export reports">
    <a href={`${href}&format=print`} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "primary", size: "sm" })}><Printer className="size-4" aria-hidden="true" />Print / PDF<span className="sr-only"> (opens new tab)</span></a>
    <a href={`${href}&format=xlsx`} className={buttonStyles({ variant: "secondary", size: "sm" })}><FileSpreadsheet className="size-4" aria-hidden="true" />Excel</a>
    <a href={`${href}&format=csv`} className={buttonStyles({ variant: "secondary", size: "sm" })}><FileDown className="size-4" aria-hidden="true" />CSV</a>
    <p className="basis-full text-xs font-normal text-slate-500">Submission dates: {range.from} to {range.to} (UTC). Exported timestamps use Philippine time.</p>
  </div>;
}
