import { CircleAlert } from "lucide-react";
import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlStyles =
  "min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-[15px] text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-600 focus:ring-3 focus:ring-sky-200/70 disabled:bg-slate-100 disabled:text-slate-500 read-only:bg-slate-50 read-only:text-slate-600 aria-[invalid=true]:border-red-600 aria-[invalid=true]:ring-3 aria-[invalid=true]:ring-red-100";

interface FieldBase {
  label: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

export interface FormFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "required">,
    FieldBase {
  inputClassName?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  {
    label,
    helperText,
    error,
    required,
    optional,
    className,
    inputClassName,
    leading,
    trailing,
    id: suppliedId,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const helperId = helperText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("min-w-0", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">
          {label}
          {required ? <span className="ml-1 text-red-700" aria-hidden="true">*</span> : null}
          {required ? <span className="sr-only"> (Required)</span> : null}
        </label>
        {optional ? <span className="text-xs text-slate-500">Optional</span> : null}
      </div>
      <div className="relative">
        {leading ? <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">{leading}</span> : null}
        <input
          ref={ref}
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(controlStyles, Boolean(leading) && "pl-11", Boolean(trailing) && "pr-12", inputClassName)}
          {...props}
        />
        {trailing ? <span className="absolute inset-y-0 right-0 flex w-12 items-center justify-center">{trailing}</span> : null}
      </div>
      {helperText ? <p id={helperId} className="mt-1.5 text-xs leading-5 text-slate-500">{helperText}</p> : null}
      {error ? (
        <p id={errorId} className="mt-1.5 flex gap-1.5 text-sm text-red-700" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
});
