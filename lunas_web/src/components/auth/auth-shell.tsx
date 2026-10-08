import Image from "next/image";
import Link from "next/link";
import { Activity, CheckCircle2, MapPinned, ShieldCheck } from "lucide-react";
import { LunasBrand } from "@/components/ui/brand";

const capabilities = [
  { icon: MapPinned, label: "Citywide Incident Visibility" },
  { icon: Activity, label: "Automated SLA Monitoring" },
  { icon: ShieldCheck, label: "Permission-controlled Access" },
];

export function AuthShell({
  children,
  title,
  description,
  eyebrow = "Authorized personnel portal",
  wide = false,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  eyebrow?: string;
  wide?: boolean;
}) {
  return (
    <main id="main-content" className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(420px,0.92fr)_minmax(540px,1.08fr)]">
      <section className="relative isolate hidden min-h-screen overflow-hidden bg-brand-950 px-10 py-9 text-white lg:flex lg:flex-col xl:px-14 xl:py-11">
        <Image
          src="/images/lunas-command-center-city.png"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 46vw, 0px"
          className="-z-20 object-cover object-[62%_center]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#032b52]/80 via-[#032b52]/65 to-[#062641]/95" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,43,82,.28),transparent_70%)]" aria-hidden="true" />

        <LunasBrand inverse href="/login" className="w-fit" />

        <div className="my-auto max-w-xl py-14">
          <p className="mb-4 text-xs font-bold tracking-normal text-sky-200">Dagupan City Operations</p>
          <h2 className="max-w-lg text-balance text-4xl font-semibold leading-tight tracking-[-0.03em] xl:text-[2.75rem]">
            One trusted view of the city&apos;s infrastructure response.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/90">
            Coordinate reports, assignments, repairs, and verification across agencies while keeping every action accountable.
          </p>

          <ul className="mt-9 grid gap-3" aria-label="Command Center Capabilities">
            {capabilities.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm font-medium text-blue-50">
                <span className="flex size-9 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/15 pt-5 text-xs text-blue-100/80">
          <span>City Government of Dagupan</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Secure access
          </span>
        </div>
      </section>

      <section className="flex min-h-screen flex-col">
        <header className="border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
          <LunasBrand href="/login" />
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12 xl:px-14">
          <div className={wide ? "w-full max-w-2xl" : "w-full max-w-[480px]"}>
            <div className="mb-7">
              <p className="text-xs font-bold tracking-normal text-brand-700">{eyebrow}</p>
              <h1 className="mt-2 text-balance text-3xl font-semibold tracking-[-0.025em] text-slate-950 sm:text-[2rem]">
                {title}
              </h1>
              <p className="mt-2.5 max-w-xl text-[15px] leading-6 text-slate-600">{description}</p>
            </div>

            {children}
          </div>
        </div>

        <footer className="px-5 pb-6 text-center text-xs text-slate-500 sm:px-8">
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Legal and Support">
            <Link className="rounded hover:text-brand-700 hover:underline" href="/privacy">Privacy Policy</Link>
            <Link className="rounded hover:text-brand-700 hover:underline" href="/terms">Terms and Conditions</Link>
            <a className="rounded hover:text-brand-700 hover:underline" href="mailto:lunas-support@dagupan.gov.ph">Support</a>
          </nav>
          <p className="mt-2.5">LUNAS Command Center · Preview environment · v0.1.0</p>
        </footer>
      </section>
    </main>
  );
}

