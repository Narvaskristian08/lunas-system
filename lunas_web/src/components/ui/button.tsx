import { LoaderCircle } from "lucide-react";
import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "border-brand-700 bg-brand-700 text-white shadow-sm hover:border-brand-800 hover:bg-brand-800",
  secondary: "border-slate-300 bg-white text-slate-800 shadow-sm hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800",
  ghost: "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950",
  danger: "border-red-700 bg-red-700 text-white shadow-sm hover:bg-red-800",
  quiet: "border-brand-100 bg-brand-50 text-brand-800 hover:border-brand-200 hover:bg-brand-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3.5 text-sm",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-5 text-[15px]",
  icon: "size-11 p-0",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-sky-400/50 disabled:pointer-events-none disabled:opacity-55",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary",
  size = "md",
  loading,
  loadingLabel = "Working…",
  className,
  disabled,
  children,
  ...props
}: ButtonProps, ref) {
  return (
    <button
      ref={ref}
      className={buttonStyles({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});
