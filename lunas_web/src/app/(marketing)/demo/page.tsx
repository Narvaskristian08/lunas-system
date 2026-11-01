import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Route,
  Wrench,
} from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Platform Demo",
  description:
    "Explore LUNAS interface previews and the proposed report-to-maintenance workflow in this Dagupan City IT capstone prototype.",
};

const walkthrough = [
  { icon: FileText, title: "Report an infrastructure concern", detail: "The citizen experience supports descriptions, photographs, location selection, and report status." },
  { icon: ClipboardCheck, title: "Record assigned field findings", detail: "Committee Staff can review an assigned inspection and submit findings and supporting evidence." },
  { icon: Route, title: "Coordinate review and agency work", detail: "Web workspaces present incident review, agency coordination, work orders, and configured deadlines." },
  { icon: Wrench, title: "Follow maintenance progress", detail: "Work-order views bring assignments, progress updates, evidence, and review into the incident record." },
];

const screens = [
  {
    src: "/images/landing/citizen-dashboard.png",
    alt: "Citizen mobile dashboard with synthetic demonstration reports",
    width: 1080,
    height: 2400,
    title: "Citizen mobile application",
    detail: "Reporting, location selection, status history, and notifications.",
    className: "mx-auto h-[380px] w-[172px] rounded-t-[24px] border-[5px] border-[#062641] object-cover object-top shadow-lg",
  },
  {
    src: "/images/landing/committee-staff-inspections.png",
    alt: "Committee Staff inspection list with a synthetic demonstration report",
    width: 1080,
    height: 2400,
    title: "Field inspection workspace",
    detail: "Assigned inspections, findings, and supporting evidence.",
    className: "mx-auto h-[380px] w-[172px] rounded-t-[24px] border-[5px] border-[#062641] object-cover object-top shadow-lg",
  },
  {
    src: "/images/landing/utility-provider-work-orders.png",
    alt: "Utility Provider web workspace showing synthetic work-order examples",
    width: 1440,
    height: 900,
    title: "Web command center",
    detail: "Incident review and Utility Provider work-order views.",
    className: "mt-2 w-full rounded-xl border border-border object-cover object-top shadow-lg",
  },
];

export default function DemoPage() {
  return (
    <div className="bg-background">
      <section className="marketing-page-hero px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Platform demo</p>
            <h1 className="mt-4 max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[56px]">
              Explore the LUNAS prototype
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              Follow the proposed path from citizen reporting through field review, agency coordination, maintenance, and status updates.
            </p>
          </div>
          <aside className="marketing-page-hero-card rounded-2xl p-5 sm:p-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-700 text-white">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-700">Academic capstone</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-foreground">PHINMA University of Pangasinan</p>
            <p className="mt-1 text-sm leading-6 text-muted">Bachelor of Science in Information Technology</p>
          </aside>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="walkthrough-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="walkthrough-title"
            eyebrow="Guided walkthrough"
            title="From an infrastructure report to coordinated maintenance"
            description="The capstone prototype connects mobile reporting and field-inspection views with role-scoped web workspaces."
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {walkthrough.map(({ icon: Icon, title, detail }, index) => (
              <li key={title} className="marketing-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-extrabold tracking-wide text-muted">{String(index + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="mt-5 text-base font-bold leading-6 text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="marketing-dot-grid bg-brand-50/70 px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="screens-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="screens-title"
            eyebrow="Interface previews"
            title="A closer look at the LUNAS screens"
            description="The product views below use synthetic local demonstration records."
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {screens.map(({ src, alt, width, height, title, detail, className }) => (
              <figure key={title} className="marketing-card-hover overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="flex h-[320px] items-start justify-center overflow-hidden bg-[#eef3fa] px-5 pt-5 sm:h-[360px]">
                  <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 1024px) 80vw, 360px" className={className} />
                </div>
                <figcaption className="p-5">
                  <h2 className="font-bold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
                  <p className="mt-3 text-xs font-semibold text-brand-700">Synthetic demonstration data</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-brand-200 bg-white/85 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <p className="max-w-3xl text-sm leading-6 text-muted">
                LUNAS is an academic prototype focused on infrastructure monitoring and maintenance coordination in Dagupan City, Pangasinan.
              </p>
            </div>
            <Link href="/research" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800">
              Read the Research <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
