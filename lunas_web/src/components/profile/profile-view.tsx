"use client";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileSummary } from "@/components/profile/profile-summary";
import { useViewer } from "@/components/providers/viewer-provider";

function ProfileWorkspace() {
  const viewer = useViewer();
  return (
    <>
      <PageHeader
        title="My profile"
        eyebrow="Account"
        description="Review your account details, assigned access, and security status."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "My profile" }]}
      />
      <ProfileSummary viewer={viewer} />
    </>
  );
}

export function ProfileView() {
  return (
    <PermissionGate permission="profile.manage" mode="denied">
      <ProfileWorkspace />
    </PermissionGate>
  );
}
