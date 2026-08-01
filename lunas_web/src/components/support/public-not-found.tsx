"use client";

import Link from "next/link";
import { SystemState } from "@/components/states/system-state";
import { LunasBrand } from "@/components/ui/brand";

export function PublicNotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb]">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto max-w-7xl"><LunasBrand href="/login" /></div>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 sm:px-6">
        <SystemState
          kind="notFound"
          eyebrow="404"
          title="Page not found"
          description="The address may be incorrect, or the page may have moved. No protected information has been displayed."
          primaryAction={{ label: "Return to dashboard", href: "/dashboard" }}
          secondaryAction={{ label: "Go back", onClick: () => window.history.back() }}
          tertiaryAction={{ label: "Open help after signing in", href: "/login?next=%2Fhelp" }}
          fullPage
        />
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
        <p>© 2026 Dagupan City Government · LUNAS · Authorized government use only</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/privacy" className="font-semibold hover:text-brand-700">Privacy Policy</Link>
          <Link href="/terms" className="font-semibold hover:text-brand-700">Terms and Conditions</Link>
        </div>
      </footer>
    </div>
  );
}
