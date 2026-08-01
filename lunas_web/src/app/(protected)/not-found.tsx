"use client";

import { SystemState } from "@/components/states/system-state";

export default function ProtectedNotFound() {
  return <SystemState kind="notFound" eyebrow="404" title="Page not found" description="The requested command-center page may have moved, or the link is no longer available." primaryAction={{ label: "Return to dashboard", href: "/dashboard" }} secondaryAction={{ label: "Go back", onClick: () => window.history.back() }} tertiaryAction={{ label: "Search help topics", href: "/help" }} />;
}
