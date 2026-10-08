import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-medium text-slate-500">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
            {index ? <ChevronRight className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" /> : null}
            {item.href ? <Link href={item.href} className="truncate rounded px-1 py-0.5 hover:text-brand-700">{item.label}</Link> : <span className="truncate px-1 py-0.5 text-slate-700" aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        {eyebrow ? <p className="mb-1 text-xs font-bold tracking-normal text-brand-700">{eyebrow}</p> : null}
        <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
