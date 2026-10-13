import { cn } from "@/lib/utils";

export interface DataTableColumn {
  key: string;
  label: string;
  className?: string;
}

export function DataTable({
  caption,
  columns,
  rows,
  className,
  mobileCards = true,
}: {
  caption: string;
  columns: DataTableColumn[];
  rows: Array<{ id: string; cells: Record<string, React.ReactNode> }>;
  className?: string;
  mobileCards?: boolean;
}) {
  return (
    <>
    {mobileCards ? <ul aria-label={caption} className="divide-y divide-slate-200 md:hidden">
      {rows.map(row => <li key={row.id} className="min-w-0 space-y-3 bg-white p-4">
        {columns.map((column, index) => <div key={column.key} className="min-w-0 break-words [&_*]:max-w-full [&_.whitespace-nowrap]:whitespace-normal">
          {index > 0 ? <p className="mb-1 text-xs font-semibold text-slate-500">{column.label}</p> : null}
          <div className="text-sm text-slate-700">{row.cells[column.key]}</div>
        </div>)}
      </li>)}
    </ul> : null}
    <div className={cn("max-w-full overflow-x-auto", mobileCards && "hidden md:block", className)} tabIndex={0} role="region" aria-label={`${caption}, horizontally scrollable on small screens`}>
      <table className="w-full min-w-190 border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-normal text-slate-500">
            {columns.map((column) => <th key={column.key} scope="col" className={cn("px-5 py-3", column.className)}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id} className="bg-white transition-colors hover:bg-slate-50">
              {columns.map((column) => <td key={column.key} className={cn("px-5 py-3.5 text-slate-700", column.className)}>{row.cells[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}
