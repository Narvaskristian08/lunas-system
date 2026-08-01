"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/states/system-state";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("LUNAS route error", error.digest ?? "no-reference");
  }, [error]);
  return (
    <main id="main-content" className="min-h-screen bg-slate-50">
      <ErrorState fullPage referenceId={error.digest} onRetry={unstable_retry} />
    </main>
  );
}
