import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: {
    default: "LUNAS Command Center",
    template: "%s | LUNAS",
  },
  description:
    "AI-assisted urban infrastructure maintenance and monitoring for Dagupan City.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        <AppProviders>
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
