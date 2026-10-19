"use client";

import { useEffect, useId, useRef } from "react";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  loading,
  destructive = false,
  icon = "logout",
  children,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  icon?: "logout" | "none";
  children?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const firstField = dialogRef.current?.querySelector<HTMLElement>("input:not([disabled]), textarea:not([disabled]), select:not([disabled])");
      (firstField ?? cancelRef.current)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus();
    };
  }, [loading, onClose, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[1px] sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          {icon === "logout" ? <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"><LogOut className="size-5" aria-hidden="true" /></span> : null}
          <h2 id={titleId} className="min-w-0 flex-1 py-2 text-xl font-bold leading-7 text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} disabled={loading} className="ml-auto flex size-12 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50" aria-label="Close Dialog"><X className="size-5" aria-hidden="true" /></button>
        </div>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-stretch">
          <Button ref={cancelRef} type="button" variant="secondary" onClick={onClose} disabled={loading} className="min-h-12 min-w-0 w-full px-4 py-3 sm:flex-1">{cancelLabel}</Button>
          <Button type="button" variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading} loadingLabel="Please Wait…" className="min-h-12 min-w-0 w-full px-4 py-3 sm:flex-1">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
