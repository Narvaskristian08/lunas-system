import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { usersByRole } from "@/lib/mock-data";
import { readSession } from "@/lib/auth/session.server";
import type { Permission, UserProfile } from "@/types";

const usersById = new Map(Object.values(usersByRole).map((user) => [user.id, user]));

export const getViewer = cache(async (): Promise<UserProfile | null> => {
  const session = await readSession();
  if (session.status !== "authenticated") return null;
  const user = usersById.get(session.userId);
  if (!user || user.status !== "Active") return null;
  return user;
});

export async function requireViewer() {
  const session = await readSession();
  if (session.status === "expired" || session.status === "invalid") {
    redirect(`/session-expired?reason=${session.status}`);
  }
  if (session.status === "missing") redirect("/login");

  const user = usersById.get(session.userId);
  if (!user || user.status !== "Active") redirect("/session-expired?reason=revoked");
  return user;
}

export async function requirePermission(permission: Permission) {
  const viewer = await requireViewer();
  if (!viewer.permissions.includes(permission)) redirect("/unauthorized");
  return viewer;
}

export function getMockUserByEmail(email: string) {
  return Object.values(usersByRole).find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase(),
  );
}
