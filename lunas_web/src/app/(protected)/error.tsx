"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/states/system-state";

export default function ProtectedError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Protected LUNAS route failed", error.digest ?? "no-reference");
  }, [error]);
  return <ErrorState variant="data" referenceId={error.digest} onRetry={unstable_retry} />;
}
