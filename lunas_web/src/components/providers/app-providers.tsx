"use client";

import { ConnectivityProvider } from "@/components/providers/connectivity-provider";
import { ToastProvider } from "@/components/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConnectivityProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConnectivityProvider>
  );
}
