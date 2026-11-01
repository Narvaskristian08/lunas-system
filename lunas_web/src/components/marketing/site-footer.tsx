import Link from "next/link";
import { LunasMark } from "@/components/ui/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#062641] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.25fr_1fr_1fr] lg:py-14">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 rounded-lg" aria-label="LUNAS home">
            <LunasMark className="size-11" />
            <span>
              <span className="block text-lg font-extrabold tracking-[0.18em]">LUNAS</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-100">Dagupan City capstone</span>
            </span>
          </Link>
          <p className="mt-5 max-w-md text-sm leading-6 text-blue-100">
            An academic prototype exploring coordinated reporting, infrastructure maintenance, and service-level monitoring.
          </p>
          <p className="mt-5 max-w-md rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold leading-6 text-white">
            An academic prototype developed at PHINMA University of Pangasinan for research and evaluation in Dagupan City.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-blue-100">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-white">
            <li><Link className="rounded hover:text-blue-200 hover:underline" href="/">Home</Link></li>
            <li><Link className="rounded hover:text-blue-200 hover:underline" href="/#platform">Platform</Link></li>
            <li><Link className="rounded hover:text-blue-200 hover:underline" href="/research">Research</Link></li>
            <li><Link className="rounded hover:text-blue-200 hover:underline" href="/about">About</Link></li>
            <li><Link className="rounded hover:text-blue-200 hover:underline" href="/demo">Platform Demo</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-blue-100">Project information</h2>
          <p className="mt-4 text-sm leading-6 text-blue-100">
            PHINMA University of Pangasinan<br />
            Bachelor of Science in Information Technology
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm">
            <Link className="rounded underline underline-offset-4 hover:text-blue-200" href="/privacy">Website privacy</Link>
            <Link className="rounded underline underline-offset-4 hover:text-blue-200" href="/login">Authorized system login</Link>
          </div>
          <p className="mt-8 text-xs text-blue-200">© {new Date().getFullYear()} LUNAS capstone project</p>
        </div>
      </div>
    </footer>
  );
}
