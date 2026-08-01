"use client";

import { createContext, useContext } from "react";
import type { UserProfile } from "@/types";

const ViewerContext = createContext<UserProfile | null>(null);

export function ViewerProvider({
  viewer,
  children,
}: {
  viewer: UserProfile;
  children: React.ReactNode;
}) {
  return <ViewerContext.Provider value={viewer}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  const viewer = useContext(ViewerContext);
  if (!viewer) throw new Error("useViewer must be used inside a protected LUNAS route");
  return viewer;
}
