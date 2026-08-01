import Link from "next/link";
import { cn } from "@/lib/utils";

export function LunasMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-7" fill="none">
        <path d="M6 6h8v8H6V6Z" fill="currentColor" opacity=".96" />
        <path d="M18 6h8v8h-8V6Z" fill="currentColor" opacity=".68" />
        <path d="M6 18h8v8H6v-8Z" fill="currentColor" opacity=".68" />
        <path d="M18 18h8v8h-8v-8Z" fill="currentColor" opacity=".96" />
        <path d="M12.2 16h7.6" stroke="#004D99" strokeWidth="2" />
      </svg>
    </span>
  );
}

export function LunasBrand({
  compact = false,
  inverse = false,
  href = "/dashboard",
  className,
}: {
  compact?: boolean;
  inverse?: boolean;
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex min-w-0 items-center gap-3 rounded-lg", className)}
      aria-label="LUNAS command center"
    >
      <LunasMark />
      {!compact ? (
        <span className="min-w-0">
          <span className={cn("block text-lg font-bold tracking-[0.18em]", inverse ? "text-white" : "text-[#111c2d]")}>LUNAS</span>
          <span className={cn("block truncate text-[10px] font-medium uppercase tracking-[0.08em]", inverse ? "text-blue-100" : "text-slate-500")}>Urban infrastructure command center</span>
        </span>
      ) : null}
    </Link>
  );
}
