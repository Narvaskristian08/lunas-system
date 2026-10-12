import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BackendApiError, backendRequest, isBackendApiError, responseData } from "@/lib/api/backend.server";
import { rolePermissions } from "@/lib/permissions";
import { readSession } from "@/lib/auth/session.server";
import { SESSION_REFRESH_UNAVAILABLE_HEADER } from "@/lib/auth/session-crypto";
import type { BackendUserRole, Permission, UserProfile, UserRole } from "@/types";

interface BackendUser {
  id?: string;
  _id?: string;
  firstName?: string;
  middleName?: string;
  suffix?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  address?: {
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
  };
  barangay?: string;
  utilityCompany?: string;
  repairOrganization?: string;
  organization?: string;
  unit?: string;
  personnelId?: string;
  profileImage?: string;
  isVerified?: boolean;
  recoveryEmailStatus?: {
    configured?: boolean;
    verified?: boolean;
  };
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

const roleLabels: Record<BackendUserRole, UserRole> = {
  citizen: "Citizen",
  repair_personnel: "Repair Personnel",
  barangay_official: "Barangay Official",
  city_engineer: "City Engineer",
  utility_provider: "Utility Provider",
  admin: "Admin",
};

function isBackendRole(role: string | undefined): role is BackendUserRole {
  return Boolean(role && role in roleLabels);
}

function organizationFor(user: BackendUser, role: BackendUserRole) {
  if (user.organization?.trim()) return user.organization;
  if (user.utilityCompany?.trim()) return user.utilityCompany;
  if (role === "repair_personnel" && user.repairOrganization?.trim()) return user.repairOrganization;
  if (role === "barangay_official" && user.barangay?.trim()) return `Barangay ${user.barangay}`;
  if (role === "citizen") return user.address?.barangay
    ? `Resident of ${user.address.barangay}`
    : "Dagupan City resident";
  if (role === "city_engineer") return "Dagupan City Engineering Office";
  if (role === "repair_personnel") return "Assigned repair organization";
  if (role === "admin") return "LUNAS Systems Operations";
  return "LUNAS partner organization";
}

export function toViewer(user: BackendUser): UserProfile | null {
  if (!isBackendRole(user.role)) return null;
  const id = user.id ?? user._id;
  if (!id || !user.firstName || !user.lastName || !user.email) return null;

  const role = roleLabels[user.role];
  // Older API deployments do not return recoveryEmailStatus yet. Treat those
  // responses as already configured so a rolling deployment does not lock
  // users out before the backend schema is available.
  const recoveryStatus = user.recoveryEmailStatus;
  return {
    id: String(id),
    firstName: user.firstName,
    middleName: user.middleName,
    suffix: user.suffix,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role,
    backendRole: user.role,
    organization: organizationFor(user, user.role),
    utilityCompany: user.utilityCompany?.trim() || undefined,
    barangay: user.barangay?.trim() || user.address?.barangay?.trim() || undefined,
    unit: user.unit,
    personnelId: user.personnelId,
    status: user.isActive === false ? "Deactivated" : "Active",
    verified: Boolean(user.isVerified),
    recoveryEmailConfigured: recoveryStatus ? Boolean(recoveryStatus.configured) : true,
    recoveryEmailVerified: recoveryStatus ? Boolean(recoveryStatus.verified) : true,
    lastLogin: user.lastLogin,
    joinedAt: user.createdAt ?? new Date(0).toISOString(),
    permissions: rolePermissions[role],
    avatarUrl: user.profileImage,
  };
}

async function getCurrentUser(accessToken: string) {
  try {
    return responseData(await backendRequest<BackendUser>("/users/me", { accessToken }));
  } catch (error) {
    // The existing API exposed this endpoint under /auth/me. Keeping the
    // fallback lets a deployment move to the narrowed /users/me contract
    // without breaking currently running installations.
    if (!isBackendApiError(error) || error.status !== 404) throw error;
    return responseData(await backendRequest<BackendUser>("/auth/me", { accessToken }));
  }
}

export const getViewer = cache(async (): Promise<UserProfile | null> => {
  const session = await readSession();
  if (session.status !== "authenticated") return null;
  if ((await headers()).get(SESSION_REFRESH_UNAVAILABLE_HEADER) === "1") {
    throw new BackendApiError(503, "The LUNAS authentication service is temporarily unavailable.");
  }

  try {
    return toViewer(await getCurrentUser(session.accessToken));
  } catch (error) {
    if (isBackendApiError(error) && [401, 403].includes(error.status)) return null;
    throw error;
  }
});

export async function requireViewer() {
  const session = await readSession();
  if (session.status === "expired" || session.status === "invalid") {
    redirect(`/session-expired?reason=${session.status}`);
  }
  if (session.status === "missing") redirect("/login");

  const user = await getViewer();
  if (!user || user.status !== "Active") redirect("/session-expired?reason=revoked");
  return user;
}

export async function requireWebWorkspace() {
  const viewer = await requireViewer();
  if (["citizen", "repair_personnel"].includes(viewer.backendRole)) {
    redirect("/unauthorized?platform=mobile");
  }
  return viewer;
}

export async function requirePermission(permission: Permission) {
  const viewer = await requireViewer();
  if (!viewer.permissions.includes(permission)) redirect("/unauthorized");
  return viewer;
}

export async function requireAccessToken() {
  const session = await readSession();
  if (session.status !== "authenticated") redirect("/login");
  return session.accessToken;
}
