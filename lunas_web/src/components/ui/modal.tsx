"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, title, action, children, busy = false, size = "wide", onClose }: {
  open: boolean;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  busy?: boolean;
  size?: "wide" | "compact";
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open || !ref.current) return;
    const element = ref.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  return <dialog ref={ref} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}
    className={`fixed inset-0 z-50 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] ${size === "compact" ? "max-w-xl" : "max-w-4xl"} overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/50 backdrop:backdrop-blur-[1px]`}>
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
        <h2 id={titleId} className="min-w-0 text-lg font-semibold text-slate-950">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          <button type="button" disabled={busy} onClick={onClose} aria-label={`Close ${title}`} className="flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="size-5" aria-hidden="true" /></button>
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto p-5 sm:p-6">{children}</div>
    </div>
  </dialog>;
}
