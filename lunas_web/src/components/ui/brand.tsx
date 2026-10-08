import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function LunasMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src="/images/lunas_logo.png"
        alt=""
        width={40}
        height={40}
        className="size-full object-contain"
      />
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
      aria-label="LUNAS Command Center"
    >
      <LunasMark />
      {!compact ? (
        <span className="min-w-0">
          <span className={cn("block text-lg font-bold tracking-[0.18em]", inverse ? "text-white" : "text-[#111c2d]")}>LUNAS</span>
          <span className={cn("block truncate text-[10px] font-medium uppercase tracking-[0.08em]", inverse ? "text-blue-100" : "text-slate-500")}>Urban Infrastructure Command Center</span>
        </span>
      ) : null}
    </Link>
  );
}
