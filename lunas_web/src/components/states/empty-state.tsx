import Link from "next/link";
import { BellOff, FileQuestion, FolderOpen, SearchX } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const icons = { notifications: BellOff, search: SearchX, records: FolderOpen, data: FileQuestion };

export function EmptyState({
  icon = "data",
  title,
  description,
  action,
  size = "card",
}: {
  icon?: keyof typeof icons;
  title: string;
  description: string;
  action?: { label: string; href?: string; onClick?: () => void };
  size?: "card" | "compact" | "page";
}) {
  const Icon = icons[icon];
  const actionClass = buttonStyles({ variant: "secondary", size: "md", className: "mt-5" });
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 text-center", size === "page" ? "min-h-[55vh] py-16" : size === "compact" ? "py-8" : "py-14")}>
      <span className="flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500"><Icon className="size-6" aria-hidden="true" /></span>
      <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action?.href ? <Link href={action.href} className={actionClass}>{action.label}</Link> : null}
      {action?.onClick ? <button type="button" className={actionClass} onClick={action.onClick}>{action.label}</button> : null}
    </div>
  );
}
