import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  MapPin,
  Route,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Camera,
    title: "AI-assisted hazard recognition",
    description: "Image models can suggest selected infrastructure-hazard categories. A person reviews reports and makes the official decision.",
  },
  {
    icon: FileText,
    title: "Central incident reporting",
    description: "Citizens can submit supported infrastructure concerns with incident details, photographs, and a selected location.",
  },
  {
    icon: ShieldCheck,
    title: "Role-scoped review",
    description: "The prototype provides different views for citizen reporting, assigned field checks, barangay review, agency work, and administration.",
  },
  {
    icon: Clock3,
    title: "Configured SLA monitoring",
    description: "Tracks configured service deadlines and provides approaching and overdue reminders within the prototype's incident workflows.",
  },
  {
    icon: Wrench,
    title: "Work-order coordination",
    description: "Utility Provider workflows include work-order creation, eligible worker assignment, progress updates, evidence, and review.",
  },
  {
    icon: Bell,
    title: "Status history and updates",
    description: "Incident histories and recipient-scoped notifications help users follow report progress and related updates.",
  },
];

const workflow: { icon: LucideIcon; role: string; title: string; description: string }[] = [
  {
    icon: FileText,
    role: "01 · Citizen",
    title: "Submit an incident report",
    description: "Share the concern, supporting photographs, and a selected damage location. AI may assist with supported hazard recognition; it does not approve a report or choose final priority.",
  },
  {
    icon: ClipboardCheck,
    role: "02 · Committee Staff",
    title: "Complete an assigned field check",
    description: "Committee Staff record findings and available field evidence for an assigned report. This work is separate from the Infrastructure Committee's review decision.",
  },
  {
    icon: ShieldCheck,
    role: "03 · Infrastructure Committee (Barangay Official)",
    title: "Review the field findings",
    description: "The assigned barangay reviewer may approve, reject, or request clarification. Duplicate reporting can also be identified through supported review actions.",
  },
  {
    icon: Route,
    role: "04 · City Engineer",
    title: "Confirm, prioritize, and route",
    description: "In the target process, an authorized City Engineer confirms the incident, assigns priority and the applicable configured SLA, then routes it to the responsible Utility Provider.",
  },
  {
    icon: Building2,
    role: "05 · Utility Provider",
    title: "Assess readiness and external steps",
    description: "The agency assesses responsibility and readiness. Funding, bidding, or other external processing is recorded only when it applies; those activities remain outside LUNAS.",
  },
  {
    icon: Wrench,
    role: "06 · Utility Provider and Repair Personnel",
    title: "Authorize and carry out maintenance",
    description: "The Utility Provider creates a work order and assigns eligible Repair Personnel. The worker can report progress and submit supporting evidence in the intended workflow.",
  },
  {
    icon: CheckCircle2,
    role: "07 · Human review",
    title: "Review completion and close",
    description: "The Utility Provider reviews submitted work and can request corrections. The target process reserves final verification and official closure for the authorized City Engineer.",
  },
  {
    icon: Bell,
    role: "08 · Citizen",
    title: "Track status and available updates",
    description: "Citizens can follow report status, available history, and relevant notifications in the mobile application.",
  },
];

const challenges = [
  "Reports can arrive through disconnected channels.",
  "People may have limited visibility into report progress.",
  "Responsible offices need a clear handoff record.",
  "Maintenance updates and evidence can be difficult to follow.",
];

function ProductImage({
  src,
  alt,
  width,
  height,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className: string;
  sizes: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
    />
  );
}

export function HomePage() {
  return (
    <>
      <section className="marketing-city-hero relative overflow-hidden text-white">
        <Image
          src="/images/lunas-command-center-city.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover object-center"
        />
        <div className="marketing-hero-overlay absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid min-h-[660px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-20">
          <div className="marketing-enter max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-bold tracking-wide text-blue-50 backdrop-blur">
              <span className="size-2 rounded-full bg-blue-300" aria-hidden="true" />
              Civic technology · Dagupan City, Pangasinan
            </span>
            <h1 className="mt-7 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[52px] xl:text-[54px]">
              Smarter Reporting.
              <span className="block text-blue-200">Better Coordination.</span>
              <span className="block">Stronger Communities.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-blue-50/90 sm:text-lg sm:leading-8">
              LUNAS is an AI-assisted urban infrastructure management prototype for citizen reporting, local coordination, maintenance tracking, and incident updates.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/#platform"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-900 shadow-md transition hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-white"
              >
                Explore the Platform <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline-white"
              >
                View the Demo <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-xs leading-5 text-blue-100">
              Academic prototype for research and evaluation. Product screens below use synthetic local demonstration records.
            </p>
          </div>

          <div className="marketing-enter relative mx-auto w-full max-w-[650px] pb-9 lg:mt-4">
            <div className="overflow-hidden rounded-2xl border border-white/30 bg-white p-2.5 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border px-3 pb-2.5 pt-1">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2 rounded-full bg-brand-300" />
                  <span className="size-2 rounded-full bg-brand-500" />
                  <span className="size-2 rounded-full bg-brand-700" />
                </span>
                <span className="ml-2 text-[10px] font-semibold tracking-wide text-muted">LUNAS · Infrastructure Committee view</span>
              </div>
              <ProductImage
                src="/images/landing/infrastructure-committee-dashboard.png"
                alt="LUNAS Infrastructure Committee web dashboard with synthetic demonstration records"
                width={1440}
                height={900}
                sizes="(max-width: 768px) 90vw, 640px"
                className="h-[235px] w-full rounded-b-lg object-cover object-top sm:h-[300px]"
              />
            </div>
            <div className="absolute -bottom-2 right-1 w-[120px] overflow-hidden rounded-[24px] border-[5px] border-[#062641] bg-[#062641] shadow-2xl sm:right-5 sm:w-[142px]">
              <ProductImage
                src="/images/landing/citizen-dashboard.png"
                alt="LUNAS citizen mobile dashboard with synthetic demonstration records"
                width={1080}
                height={2400}
                sizes="142px"
                className="h-[256px] w-full rounded-[18px] object-cover object-top sm:h-[310px]"
              />
            </div>
            <span className="absolute -bottom-8 left-1 rounded-full border border-white/25 bg-[#062641]/85 px-3 py-1.5 text-[10px] font-semibold text-white backdrop-blur">
              Concept illustration + actual app screens
            </span>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-20 sm:px-8 lg:py-24" aria-labelledby="challenge-title">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Why LUNAS</p>
            <h2 id="challenge-title" className="mt-3 max-w-xl text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Infrastructure concerns need a visible path from report to review.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              LUNAS explores a shared record for reporting, field findings, responsible-office coordination, maintenance updates, and follow-up.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {challenges.map((challenge, index) => (
              <div key={challenge} className="marketing-card-hover flex min-h-[112px] items-start gap-3 rounded-2xl border border-border bg-background p-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-extrabold text-brand-800">
                  0{index + 1}
                </span>
                <p className="pt-1 text-sm font-semibold leading-6 text-foreground">{challenge}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-5 rounded-2xl bg-brand-50 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm">
            <Activity className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">A connected prototype for shared operational context</h3>
            <p className="mt-1.5 max-w-4xl text-sm leading-6 text-muted">
              LUNAS brings reporting, review, coordination, work-order information, and configured deadline monitoring into related mobile and web experiences. It supports decisions by people; it does not replace their authority.
            </p>
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-24 bg-background px-5 py-20 sm:px-8 lg:py-24" aria-labelledby="features-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="features-title"
            eyebrow="Platform"
            title="Tools for reporting, coordination, and maintenance follow-through"
            description="The current prototype combines mobile reporting and field-check experiences with role-scoped web workspaces."
          />
          <div className="mt-11 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="marketing-card-hover group rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-muted">{description}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-brand-950">
              The proposed workflow keeps verification, priority, routing, and closure decisions with authorized people. AI hazard suggestions support review and do not make those decisions.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-20 sm:px-8 lg:py-24" aria-labelledby="workflow-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="workflow-title"
            eyebrow="How LUNAS is designed to work"
            title="A human-led path from citizen report to resolution"
            description="The sequence below is the target workflow for the project. Optional rejection, duplicate, clarification, reassignment, and correction paths sit alongside the main path."
          />
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-brand-950">
              This is the proposed capstone workflow. Review, priority, routing, maintenance, and completion decisions remain with people in authorized roles; AI suggestions are advisory.
            </p>
          </div>
          <ol className="mt-8 grid gap-4 md:grid-cols-2">
            {workflow.map(({ icon: Icon, role, title, description }, index) => (
              <li key={role} className="marketing-card-hover relative flex gap-4 rounded-2xl border border-border bg-background p-5 pr-16 sm:p-6 sm:pr-16">
                <span className="absolute right-5 top-5 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-muted" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")} / {String(workflow.length).padStart(2, "0")}
                </span>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-brand-700">{role}</p>
                  <h3 className="mt-1 text-base font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                  <span className="sr-only">Workflow step {index + 1} of {workflow.length}</span>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm leading-6 text-muted">
            Committee Staff is the capstone interface designation for assigned field inspections, shown separately from Infrastructure Committee review.
          </p>
        </div>
      </section>

      <section className="marketing-dot-grid bg-brand-50/70 px-5 py-20 sm:px-8 lg:py-24" aria-labelledby="showcase-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="showcase-title"
            eyebrow="Product preview"
            title="Actual LUNAS interfaces, shown with synthetic records"
            description="These interface previews use synthetic local demonstration records."
          />
          <div className="mt-11 grid gap-5 lg:grid-cols-3">
            <figure className="marketing-card-hover overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex min-h-[290px] items-start justify-center overflow-hidden bg-[#eef3fa] px-6 pt-6">
                <ProductImage
                  src="/images/landing/citizen-dashboard.png"
                  alt="Citizen mobile dashboard displaying synthetic active and resolved report examples"
                  width={1080}
                  height={2400}
                  sizes="(max-width: 1024px) 80vw, 300px"
                  className="h-[360px] w-[162px] rounded-t-[22px] border-[5px] border-[#062641] object-cover object-top shadow-lg"
                />
              </div>
              <figcaption className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Citizen mobile app</p>
                <h3 className="mt-2 text-lg font-bold text-foreground">Report concerns and follow available updates</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Reporting, evidence, location selection, status history, and notifications.</p>
                <p className="mt-3 text-xs font-medium text-muted">Synthetic local demonstration data.</p>
              </figcaption>
            </figure>

            <figure className="marketing-card-hover overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="flex min-h-[290px] items-start justify-center overflow-hidden bg-[#eef3fa] px-6 pt-6">
                <ProductImage
                  src="/images/landing/committee-staff-inspections.png"
                  alt="Committee Staff assigned inspection list with a synthetic local test report"
                  width={1080}
                  height={2400}
                  sizes="(max-width: 1024px) 80vw, 300px"
                  className="h-[360px] w-[162px] rounded-t-[22px] border-[5px] border-[#062641] object-cover object-top shadow-lg"
                />
              </div>
              <figcaption className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Committee Staff mobile workspace</p>
                <h3 className="mt-2 text-lg font-bold text-foreground">Record assigned field findings</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Assigned initial and completion inspections with findings and supporting evidence.</p>
                <p className="mt-3 text-xs font-medium text-muted">Synthetic local demonstration data.</p>
              </figcaption>
            </figure>

            <figure className="marketing-card-hover overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
              <div className="min-h-[290px] overflow-hidden bg-[#eef3fa] p-4 pt-7">
                <ProductImage
                  src="/images/landing/utility-provider-work-orders.png"
                  alt="Utility Provider web workspace showing synthetic work-order examples"
                  width={1440}
                  height={900}
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="w-full rounded-t-xl border border-border object-cover object-top shadow-lg"
                />
              </div>
              <figcaption className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-700">Web command center</p>
                <h3 className="mt-2 text-lg font-bold text-foreground">Review agency work and routed reports</h3>
                <p className="mt-2 text-sm leading-6 text-muted">Infrastructure Committee review and Utility Provider work-order views use scoped records.</p>
                <p className="mt-3 text-xs font-medium text-muted">Synthetic local demonstration data.</p>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-background px-5 py-20 sm:px-8 lg:py-24" aria-labelledby="research-preview-title">
        <div className="marketing-page-hero-card mx-auto grid max-w-7xl gap-10 rounded-3xl p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:p-12">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Academic capstone</p>
            <h2 id="research-preview-title" className="mt-3 max-w-3xl text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Built as a research prototype for infrastructure monitoring in Dagupan City
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Developed in the Bachelor of Science in Information Technology program at PHINMA University of Pangasinan. The project evaluates a connected approach to incident reporting and maintenance coordination.
            </p>
          </div>
          <Link href="/research" className="inline-flex min-h-12 items-center justify-center gap-2 self-start rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-800 focus-visible:outline-offset-2 lg:self-center">
            Explore the Research <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mx-auto mt-6 flex max-w-7xl items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 text-xs leading-5 text-muted">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
          Illustrative urban infrastructure image.
        </div>
      </section>

      <section className="bg-brand-800 px-5 py-14 text-white sm:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">For institutions and project partners</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">See the prototype and its research context.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Explore the platform interfaces and the research behind the capstone.</p>
          </div>
          <Link href="/demo" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-blue-50 focus-visible:outline-white">
            View the Demo <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
