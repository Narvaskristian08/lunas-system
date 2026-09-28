"use client";

import { useEffect, useRef } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => cancelRef.current?.focus());
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-[1px] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description" className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          {icon === "logout" ? <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700"><LogOut className="size-5" aria-hidden="true" /></span> : null}
          <button type="button" onClick={onClose} disabled={loading} className="ml-auto flex size-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Close dialog"><X className="size-5" aria-hidden="true" /></button>
        </div>
        <h2 id="confirmation-title" className="mt-4 text-xl font-bold text-slate-950">{title}</h2>
        <p id="confirmation-description" className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} type="button" variant="secondary" onClick={onClose} disabled={loading} className="sm:min-w-28">{cancelLabel}</Button>
          <Button type="button" variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading} loadingLabel="Please wait…" className="sm:min-w-36">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
