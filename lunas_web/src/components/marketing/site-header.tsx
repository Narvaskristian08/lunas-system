"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LunasMark } from "@/components/ui/brand";

const links = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "/#platform" },
  { label: "Research", href: "/research" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuState, setMenuState] = useState<{ path: string; open: boolean } | null>(null);
  const menuOpen = menuState?.path === pathname && menuState.open;
  const toggleMenu = () => setMenuState({ path: pathname, open: !menuOpen });
  const closeMenu = () => setMenuState({ path: pathname, open: false });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="inline-flex min-w-0 items-center gap-3 rounded-lg" aria-label="LUNAS home">
          <LunasMark className="size-11" />
          <span className="min-w-0">
            <span className="block text-base font-extrabold tracking-[0.18em] text-foreground sm:text-lg">LUNAS</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-muted sm:block">
              Infrastructure monitoring
            </span>
          </span>
        </Link>

        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border text-foreground transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-offset-2 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="public-primary-navigation"
          onClick={toggleMenu}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMenu();
          }}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        <nav
          id="public-primary-navigation"
          aria-label="Primary navigation"
          className={(menuOpen ? "flex" : "hidden") + " absolute left-0 right-0 top-full flex-col gap-1 border-b border-border bg-surface px-5 pb-5 pt-2 shadow-md lg:static lg:flex lg:flex-row lg:items-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMenu();
          }}
        >
          {links.map((link) => {
            const current = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                onClick={closeMenu}
                className={"rounded-xl px-3.5 py-2.5 text-sm font-semibold transition hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-offset-2 " + (current ? "bg-brand-50 text-brand-800" : "text-slate-700")}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/demo"
            onClick={closeMenu}
            className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 focus-visible:outline-offset-2 lg:ml-2 lg:mt-0"
          >
            View Demo <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            onClick={closeMenu}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 focus-visible:outline-offset-2"
          >
            Command Center Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
