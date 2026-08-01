"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { forwardRef, useState } from "react";
import type { FormFieldProps } from "@/components/forms/form-field";
import { FormField } from "@/components/forms/form-field";

export const PasswordField = forwardRef<HTMLInputElement, Omit<FormFieldProps, "type" | "leading" | "trailing">>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <FormField
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete ?? "current-password"}
        leading={<LockKeyhole className="size-4.5" aria-hidden="true" />}
        trailing={
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
          </button>
        }
      />
    );
  },
);
