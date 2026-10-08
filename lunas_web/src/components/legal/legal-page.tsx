"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUp, BookOpen, Check, Printer, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LunasBrand } from "@/components/ui/brand";
import { Button, buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  reviewNote?: string;
}

export function LegalPage({
  title,
  description,
  lastUpdated,
  documentLabel,
  sections,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  documentLabel: string;
  sections: LegalSection[];
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const headings = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <header className="print-hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <LunasBrand href="/login" />
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Legal Pages">
            <Link href="/privacy" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-brand-700">Privacy</Link>
            <Link href="/terms" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-brand-700">Terms</Link>
            <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm", className: "ml-2" })}>Sign in</Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        <div className="print-hidden mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-white hover:text-brand-700"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to Previous Page
          </button>
          <Button type="button" variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" /> Print This Draft
          </Button>
        </div>

        <header className="border-b border-slate-200 pb-7 print:border-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold tracking-normal text-amber-900">
              <Scale className="size-3.5" aria-hidden="true" /> Draft — legal review required
            </span>
            <span className="mono text-xs font-semibold text-slate-500">{documentLabel}</span>
          </div>
          <h1 className="mt-4 max-w-4xl text-balance text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
          <p className="mt-4 text-sm font-medium text-slate-600">Last updated: <time>{lastUpdated}</time></p>
        </header>

        <div className="mt-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" role="note">
          <Scale className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">This Is a Content Structure, Not an Approved Policy</p>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              Every section below is placeholder guidance for the designated legal, privacy, and information-security reviewers. It must be replaced or approved before production publication and must not be treated as legal advice.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,760px)] lg:justify-between xl:grid-cols-[280px_minmax(0,820px)_160px]">
          <aside className="print-hidden lg:col-start-1" aria-label="Table of Contents">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <BookOpen className="size-4 text-brand-700" aria-hidden="true" />
                <h2 className="font-semibold text-slate-950">On This Page</h2>
              </div>
              <ol className="mt-3 space-y-0.5">
                {sections.map((section, index) => {
                  const active = activeSection === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        aria-current={active ? "location" : undefined}
                        className={cn(
                          "flex min-h-10 items-start gap-2 rounded-lg px-2.5 py-2 text-sm leading-5 transition",
                          active ? "bg-brand-50 font-semibold text-brand-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        )}
                      >
                        <span className="mono mt-0.5 w-5 shrink-0 text-[11px] text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                        <span>{section.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          <article className="legal-copy min-w-0 rounded-2xl border border-slate-200 bg-white px-5 py-2 shadow-sm print:col-span-full print:border-0 print:px-0 print:shadow-none sm:px-8 lg:col-start-2">
            {sections.map((section, index) => (
              <section key={section.id} className="border-b border-slate-200 py-7 last:border-b-0 sm:py-9" aria-labelledby={section.id}>
                <div className="flex items-start gap-3">
                  <span className="mono mt-1 hidden min-w-7 text-xs font-semibold text-brand-700 sm:block">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id={section.id} className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{section.title}</h2>
                      <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold tracking-normal text-amber-900 print:border-slate-400 print:bg-transparent">
                        Review <Check className="size-3" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    {section.bullets?.length ? (
                      <ul className="mt-4 space-y-2">
                        {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                      </ul>
                    ) : null}
                    {section.reviewNote ? (
                      <div className="mt-5 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 print:border-slate-500 print:bg-transparent">
                        <strong>Reviewer note:</strong> {section.reviewNote}
                      </div>
                    ) : null}
                    <a href="#main-content" className="print-hidden mt-5 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-brand-700">
                      <ArrowUp className="size-3.5" aria-hidden="true" /> Back to top
                    </a>
                  </div>
                </div>
              </section>
            ))}
          </article>

          <aside className="print-hidden hidden xl:col-start-3 xl:block" aria-label="Document Status">
            <div className="sticky top-24 border-l border-slate-200 pl-4 text-xs leading-5 text-slate-500">
              <p className="font-bold tracking-normal text-slate-700">Document Status</p>
              <p className="mt-2">Internal content draft</p>
              <p className="mt-1">Not yet approved for production</p>
              <p className="mt-3">Use the print action for reviewer markup.</p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="print-hidden border-t border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Dagupan City Government · LUNAS</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/privacy" className="font-semibold hover:text-brand-700">Privacy Policy</Link>
            <Link href="/terms" className="font-semibold hover:text-brand-700">Terms and Conditions</Link>
            <Link href="/login" className="font-semibold hover:text-brand-700">Return to Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
