"use client";

import { Check, Circle } from "lucide-react";
import { cn, passwordChecks, passwordScore } from "@/lib/utils";

const labels = ["Not Entered", "Weak", "Fair", "Good", "Strong"];
const segmentColors = ["bg-slate-200", "bg-red-600", "bg-amber-500", "bg-sky-600", "bg-emerald-600"];

export function PasswordStrength({ password, compact = false }: { password: string; compact?: boolean }) {
  const score = passwordScore(password);
  const checks = passwordChecks(password);
  const items = [
    ["length", "At least 12 characters"],
    ["uppercase", "One uppercase letter"],
    ["lowercase", "One lowercase letter"],
    ["number", "One number"],
    ["special", "One special character"],
    ["notCommon", "Not a commonly used password"],
  ] as const;
  return (
    <div className="mt-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-slate-700">Password Strength</span>
        <span className="font-semibold text-slate-600">{labels[score]}</span>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((segment) => (
          <span key={segment} className={cn("h-1.5 rounded-full", segment <= score ? segmentColors[score] : "bg-slate-200")} />
        ))}
      </div>
      {!compact ? (
        <ul className="mt-3 grid gap-1.5 text-xs text-slate-600 sm:grid-cols-2">
          {items.map(([key, label]) => (
            <li key={key} className={cn("flex items-center gap-2", checks[key] && "text-emerald-700")}>
              {checks[key] ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />}
              {label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
