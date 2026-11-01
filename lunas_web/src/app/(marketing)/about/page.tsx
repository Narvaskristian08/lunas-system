import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TeamGrid } from "@/components/marketing/team-grid";

export const metadata: Metadata = {
  title: "About LUNAS",
  description:
    "About the LUNAS academic prototype, its Dagupan City focus, institutional context, and capstone development team.",
};

export default function AboutPage() {
  return (
    <div className="bg-background">
      <section className="marketing-page-hero px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">About the project</p>
          <h1 className="mt-4 max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
            A capstone prototype for clearer infrastructure reporting and coordination
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">
            LUNAS explores how mobile reporting, assigned field checks, role-scoped review, agency coordination, work-order information, and deadline monitoring can share a connected system.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm">
            <GraduationCap className="size-4" aria-hidden="true" />
            PHINMA University of Pangasinan · BS Information Technology capstone
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeading
              eyebrow="Purpose"
              title="Designed to make a report's progress easier to follow"
              description="The project was developed as an academic exploration of infrastructure incident reporting, local coordination, maintenance tracking, and status visibility for Dagupan City, Pangasinan."
            />
            <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
              Developed as a Bachelor of Science in Information Technology capstone at PHINMA University of Pangasinan, LUNAS presents a research prototype focused on infrastructure concerns in Dagupan City.
            </p>
            <Link href="/research" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900">
              Explore the research <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="marketing-card-hover rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-bold text-foreground">Dagupan City focus</h2>
              <p className="mt-2 text-sm leading-6 text-muted">The academic prototype and its synthetic demonstrations are scoped around infrastructure concerns in Dagupan City, Pangasinan.</p>
            </article>
            <article className="marketing-card-hover rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-bold text-foreground">Academic development</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Developed in the Bachelor of Science in Information Technology program at PHINMA University of Pangasinan.</p>
            </article>
            <article className="marketing-card-hover rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Building2 className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-bold text-foreground">Institutional collaboration</h2>
              <p className="mt-2 text-sm leading-6 text-muted">The project may inform future research conversations with government offices, academic institutions, and potential partners.</p>
            </article>
            <article className="marketing-card-hover rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-5 font-bold text-foreground">Human decisions</h2>
              <p className="mt-2 text-sm leading-6 text-muted">AI hazard suggestions support assessment while authorized personnel make review, priority, verification, and closure decisions.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="team-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="team-title"
            eyebrow="Development team"
            title="LUNAS capstone contributors"
            description="The Information Technology capstone team behind the LUNAS research prototype."
          />
          <div className="mt-8">
            <TeamGrid />
          </div>
          <p className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm font-semibold leading-6 text-brand-950">
            LUNAS is an academic prototype developed at PHINMA University of Pangasinan for research and evaluation.
          </p>
        </div>
      </section>
    </div>
  );
}
