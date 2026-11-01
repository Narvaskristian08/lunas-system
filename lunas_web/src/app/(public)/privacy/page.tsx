import type { Metadata } from "next";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Website Privacy",
  description: "Privacy information for the public LUNAS project website and its interface previews.",
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="bg-background">
        <section className="marketing-page-hero px-5 py-16 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">Privacy</p>
            <h1 className="mt-4 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Website privacy notice
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted">
              This notice describes the public LUNAS capstone website, including its project information and interface previews.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-8 lg:py-18">
          <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-9">
            <div className="space-y-8">
              <section aria-labelledby="website-content-title">
                <h2 id="website-content-title" className="text-xl font-bold text-foreground">Website content</h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  The public pages present information about the LUNAS academic prototype and show interface previews made with synthetic demonstration records.
                </p>
              </section>
              <section aria-labelledby="visitor-input-title">
                <h2 id="visitor-input-title" className="text-xl font-bold text-foreground">Information entered on this website</h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  The public pages are informational and contain no account-registration, demo-request submission, or file-upload fields. They present the project overview and interface previews.
                </p>
              </section>
              <section aria-labelledby="command-center-title">
                <h2 id="command-center-title" className="text-xl font-bold text-foreground">Command Center</h2>
                <p className="mt-3 text-sm leading-7 text-muted">
                  The Command Center Login link opens the separate LUNAS operational application and its authenticated features.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
