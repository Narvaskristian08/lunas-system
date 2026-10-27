import { FileDown, FileSpreadsheet, Printer } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import type { ReportPeriod } from "@/lib/report-export";

export function ReportExportActions({ basePath, period }: { basePath: string; period: ReportPeriod }) {
  const href = `${basePath}/export?period=${period}`;
  return <div className="contents" role="group" aria-label="Export reports">
    <a href={`${href}&format=print`} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "secondary", size: "sm", className: "h-10 w-32 shrink-0 whitespace-nowrap" })}><Printer className="size-4" aria-hidden="true" />Print / PDF<span className="sr-only"> (opens new tab)</span></a>
    <a href={`${href}&format=xlsx`} className={buttonStyles({ variant: "secondary", size: "sm", className: "h-10 w-32 shrink-0 whitespace-nowrap" })}><FileSpreadsheet className="size-4" aria-hidden="true" />Excel</a>
    <a href={`${href}&format=csv`} className={buttonStyles({ variant: "secondary", size: "sm", className: "h-10 w-32 shrink-0 whitespace-nowrap" })}><FileDown className="size-4" aria-hidden="true" />CSV</a>
  </div>;
}
