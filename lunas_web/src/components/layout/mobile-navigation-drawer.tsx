"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

export function MobileNavigationDrawer({
  open,
  onClose,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = drawerRef.current;
    const first = drawer?.querySelector<HTMLElement>("button, a[href]");
    requestAnimationFrame(() => first?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !drawer) return;
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"),
      );
      const start = focusable[0];
      const end = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault();
        end?.focus();
      }
      if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault();
        start?.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", keydown);
      trigger?.focus();
    };
  }, [onClose, open, triggerRef]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/50 lg:hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside ref={drawerRef} className="h-full w-[min(88vw,320px)] shadow-2xl" aria-label="Mobile navigation">
        <Sidebar collapsed={false} mobile onClose={onClose} onNavigate={onClose} />
      </aside>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
        aria-label="Close navigation"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
