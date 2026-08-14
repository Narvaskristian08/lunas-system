"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, LockKeyhole, Save, ShieldCheck } from "lucide-react";
import { updateProfileAction } from "@/app/actions/auth";
import { PermissionGate } from "@/components/auth/permission-gate";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/providers/toast-provider";
import { useViewer } from "@/components/providers/viewer-provider";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const namePattern = /^[\p{L}\s.'-]+$/u;
const phonePattern = /^(?:\+63|0)\s?\d{3}\s?\d{3}\s?\d{4}$/;

function validateName(value: string, label: string, required = true) {
  const normalized = value.trim();
  if (!normalized && required) return `${label} is required.`;
  if (!normalized) return undefined;
  if (normalized.length < 2) return `${label} must contain at least 2 characters.`;
  if (!namePattern.test(normalized)) return `${label} may only contain letters, spaces, apostrophes, periods, and hyphens.`;
  return undefined;
}

function EditProfileWorkspace() {
  const viewer = useViewer();
  const router = useRouter();
  const { notify } = useToast();
  const [firstName, setFirstName] = useState(viewer.firstName);
  const [lastName, setLastName] = useState(viewer.lastName);
  const [phone, setPhone] = useState(viewer.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState("/profile");

  const errors = useMemo(() => ({
    firstName: validateName(firstName, "First name"),
    lastName: validateName(lastName, "Last name"),
    phone: phone.trim() && !phonePattern.test(phone.trim()) ? "Use a Philippine number such as +63 917 123 4567 or 0917 123 4567." : undefined,
  }), [firstName, lastName, phone]);

  const dirty = firstName.trim() !== viewer.firstName
    || lastName.trim() !== viewer.lastName
    || phone.trim() !== (viewer.phone ?? "");
  const valid = !Object.values(errors).some(Boolean);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!dirty || submitting) return;
    const interceptLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const destination = `${url.pathname}${url.search}${url.hash}`;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (destination === current) return;
      event.preventDefault();
      setPendingHref(destination);
      setConfirmOpen(true);
    };
    document.addEventListener("click", interceptLink, true);
    return () => document.removeEventListener("click", interceptLink, true);
  }, [dirty, submitting]);

  const cancel = () => {
    if (!dirty) {
      router.push("/profile");
      return;
    }
    setPendingHref("/profile");
    setConfirmOpen(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dirty || !valid || submitting) return;
    setSubmitting(true);
    setFormError(undefined);

    try {
      const result = await updateProfileAction({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      if (!result.ok) {
        setFormError(result.message ?? "We couldn’t save your profile. Your changes are still here; try again in a moment.");
        return;
      }
      notify({
        title: "Profile updated",
        message: "Your editable profile details were saved successfully.",
        tone: "success",
      });
      router.push("/profile");
    } catch {
      setFormError("We couldn’t save your profile. Your changes are still here; try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Edit profile"
        eyebrow="Account settings"
        description="Update your name and contact number. Administrative account details are protected."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "My profile", href: "/profile" },
          { label: "Edit" },
        ]}
        actions={
          <Link href="/profile" className={buttonStyles({ variant: "secondary" })}>
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to profile
          </Link>
        }
      />

      <form onSubmit={submit} noValidate>
        <div className="space-y-5">
            <Card>
              <CardHeader title="Personal information" description="Fields marked with an asterisk are required." />
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <FormField
                  label="First name"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  error={errors.firstName}
                  autoComplete="given-name"
                  maxLength={60}
                />
                <FormField
                  label="Last name"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  error={errors.lastName}
                  autoComplete="family-name"
                  maxLength={60}
                />
                <FormField
                  label="Contact number"
                  optional
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  error={errors.phone}
                  helperText="Used for operational account contact only."
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={24}
                />
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Administrative account details"
                description="These values are read-only and cannot be self-assigned."
                action={<ShieldCheck className="size-5 text-brand-700" aria-label="Protected fields" />}
              />
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <FormField label="Verified email" value={viewer.email} readOnly leading={<LockKeyhole className="size-4" aria-hidden="true" />} helperText="Contact an administrator to change your verified email." />
                <FormField label="Personnel ID" value={viewer.personnelId ?? "Not assigned"} readOnly leading={<LockKeyhole className="size-4" aria-hidden="true" />} />
                <FormField label="Role" value={viewer.role} readOnly leading={<LockKeyhole className="size-4" aria-hidden="true" />} />
                <FormField label="Organization" value={viewer.organization} readOnly leading={<LockKeyhole className="size-4" aria-hidden="true" />} />
                <FormField label="Account status" value={viewer.status} readOnly leading={<LockKeyhole className="size-4" aria-hidden="true" />} />
                <FormField label="Verification status" value={viewer.verified ? "Verified" : "Pending verification"} readOnly leading={<LockKeyhole className="size-4" aria-hidden="true" />} />
              </div>
            </Card>

            {formError ? (
              <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div><p className="font-semibold">Profile was not saved</p><p className="mt-1">{formError}</p></div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-slate-500" aria-live="polite">
                {dirty ? "You have unsaved changes." : "No changes to save."}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button type="button" variant="secondary" onClick={cancel} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={!dirty || !valid} loading={submitting} loadingLabel="Saving changes…">
                  <Save className="size-4" aria-hidden="true" /> Save changes
                </Button>
              </div>
            </div>
        </div>
      </form>

      <ConfirmationDialog
        open={confirmOpen}
        title="Discard unsaved changes?"
        description="Your profile edits will be lost if you leave this page."
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        destructive
        icon="none"
        onClose={() => { setConfirmOpen(false); setPendingHref("/profile"); }}
        onConfirm={() => { setConfirmOpen(false); router.push(pendingHref); }}
      />
    </>
  );
}

export function EditProfileForm() {
  return (
    <PermissionGate permission="profile.manage" mode="denied">
      <EditProfileWorkspace />
    </PermissionGate>
  );
}
