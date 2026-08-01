import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  as: Component = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
}) {
  return (
    <Component className={cn("surface-card rounded-2xl", className)}>{children}</Component>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
