import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  BookOpen,
  CheckCircle2,
  Database,
  FlaskConical,
  GitBranch,
  Layers3,
  Smartphone,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Explore the LUNAS capstone background, system architecture, proposed workflow, and technical evaluation.",
};

const architecture = [
  { icon: Layers3, name: "Mobile application", detail: "Flutter for citizen reporting and the assigned Committee Staff inspection workspace." },
  { icon: GitBranch, name: "Web command center", detail: "Next.js and React for authorized Infrastructure Committee, Utility Provider, and Admin workspaces." },
  { icon: Database, name: "Application services", detail: "Express APIs and MongoDB records support scoped reports, work orders, histories, and notifications." },
  { icon: FlaskConical, name: "AI and evidence services", detail: "A Flask inference service supports selected hazard recognition; evidence processing and private object storage are separate services." },
];

const targetSteps = [
  "Citizen report with evidence and a selected location.",
  "Assigned Committee Staff field verification.",
  "Separate Infrastructure Committee (Barangay Official) approval or return for clarification.",
  "Responsible-agency routing and assessment.",
  "Conditional external processing when funding, bidding, or authorization is required.",
  "Utility Provider-authorized maintenance and work-order assignment.",
  "Human completion review, corrective work when needed, and authorized closure.",
  "Citizen status, history, and available updates.",
];

const evaluationAreas = [
  { icon: Database, name: "Backend logic", detail: "Automated checks examine service rules, scoped access, and API behavior." },
  { icon: GitBranch, name: "Web interface", detail: "Browser checks exercise public and operational interfaces using synthetic fixtures." },
  { icon: Smartphone, name: "Mobile application", detail: "Widget and model tests cover reporting and assigned field-inspection experiences." },
  { icon: FlaskConical, name: "Evidence processing", detail: "Local experiments examine image normalization and supplied-region redaction utilities." },
];

export default function ResearchPage() {
  return (
    <div className="bg-background">
      <section className="marketing-page-hero px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Research and academic showcase</p>
              <h1 className="mt-4 max-w-5xl text-balance text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
                LUNAS: An AI-Assisted Urban Infrastructure Maintenance and Monitoring System with Automated SLA Management
              </h1>
              <p className="mt-6 max-w-4xl text-base leading-7 text-muted">
                The capstone focuses on the development and technical evaluation of a connected infrastructure incident-reporting, coordination, monitoring, and maintenance prototype for Dagupan City, Pangasinan.
              </p>
            </div>
            <aside className="marketing-page-hero-card rounded-2xl p-6 sm:p-7">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.14em] text-brand-700">Academic institution</p>
              <h2 className="mt-2 text-xl font-bold leading-7 text-foreground">PHINMA University of Pangasinan</h2>
              <p className="mt-2 text-sm leading-6 text-muted">Bachelor of Science in Information Technology</p>
              <div className="my-5 h-px bg-border" />
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">Research focus</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-foreground">Infrastructure reporting and maintenance coordination in Dagupan City, Pangasinan.</p>
            </aside>
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm leading-6 text-brand-950 sm:p-5">
            <BookOpen className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
            <p>
              LUNAS is a Bachelor of Science in Information Technology capstone prototype developed at PHINMA University of Pangasinan for research and evaluation.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="research-scope">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="Study context"
              title="A shared record for infrastructure concerns"
              description="The project explores how a single prototype can connect citizen-submitted concerns with field findings, authorized review, agency coordination, maintenance updates, and status visibility."
            />
            <h2 id="research-scope" className="mt-9 text-xl font-bold text-foreground">Project scope</h2>
            <ul className="mt-4 space-y-3">
              {[
                "Citizen reports include supported infrastructure categories, descriptions, photographs, and selected locations.",
                "A Committee Staff member can record findings for an assigned field inspection.",
                "Infrastructure Committee and Utility Provider workspaces provide scoped review and operational views.",
                "The prototype includes work-order coordination, agency status, incident histories, notifications, and configured SLA tools.",
              ].map((item) => (
                <li key={item} className="marketing-card-hover flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-muted">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-700" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">System architecture</h2>
            <p className="mt-2 text-sm leading-6 text-muted">The system brings together mobile, web, API, database, AI, and evidence-storage services.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {architecture.map(({ icon: Icon, name, detail }) => (
                <article key={name} className="marketing-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="methodology-title">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              id="methodology-title"
              eyebrow="Development and evaluation"
              title="Technical evaluation across the LUNAS platform"
              description="The capstone evaluation examines software behavior across backend services, web and mobile interfaces, and image evidence utilities."
            />
            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5">
              <Activity className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
              <p className="text-sm leading-6 text-brand-950">
                Evaluation combines automated backend tests, browser checks with synthetic fixtures, isolated controller checks, mobile widget and model tests, and local image-processing experiments.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {evaluationAreas.map(({ icon: Icon, name, detail }) => (
              <article key={name} className="marketing-card-hover rounded-2xl border border-border bg-background p-5 shadow-sm">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-bold text-foreground">{name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20" aria-labelledby="workflow-research-title">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            id="workflow-research-title"
            eyebrow="Target workflow"
            title="The intended report-to-resolution sequence"
            description="This is the project's revised target, with separate field verification, committee review, agency assessment, conditional external processing, authorized maintenance, and human closure."
          />
          <ol className="mt-8 grid gap-3 sm:grid-cols-2">
            {targetSteps.map((step, index) => (
              <li key={step} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-extrabold text-brand-800">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="pt-1 text-sm leading-6 text-foreground">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-7 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6">
            <Users className="mt-0.5 size-5 shrink-0 text-brand-700" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-foreground">Human-led service coordination</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                The proposed process keeps report verification, approval, priority, routing, maintenance review, and closure with authorized personnel. AI-generated hazard suggestions support assessment and do not replace human decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand-800 px-5 py-14 text-white sm:px-8 lg:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-200">Academic team</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Meet the LUNAS capstone team</h2>
          </div>
          <Link href="/about" className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-900 transition hover:bg-blue-50">
            About the Project <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
