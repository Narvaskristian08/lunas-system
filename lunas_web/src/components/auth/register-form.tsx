"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Mail, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerCitizenAction } from "@/app/actions/auth";
import { AuthAlert, AuthCard, BackToLogin, SecurityNotice } from "@/components/auth/auth-ui";
import { FormField } from "@/components/forms/form-field";
import { PasswordField } from "@/components/forms/password-field";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/utils";

const passwordHint = "Use 8–128 characters with an uppercase letter, lowercase letter, and number.";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [noMiddleName, setNoMiddleName] = useState(false);
  const [suffix, setSuffix] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const errors: Record<string, string> = {};
    if (!firstName.trim()) errors.firstName = "Enter your first name.";
    if (!noMiddleName && !middleName.trim()) errors.middleName = "Enter your middle name or select the checkbox.";
    if (!lastName.trim()) errors.lastName = "Enter your last name.";
    if (!isValidEmail(email.trim())) errors.email = "Enter a valid email address.";
    if (password.length < 8 || password.length > 128 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = "Use 8–128 characters with an uppercase letter, lowercase letter, and number.";
    }
    if (password !== confirmPassword) errors.confirmPassword = "Passwords must match.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("Review the highlighted fields.");
      return;
    }

    setPending(true);
    setError("");
    setFieldErrors({});
    try {
      const result = await registerCitizenAction({
        firstName,
        middleName,
        noMiddleName,
        suffix,
        lastName,
        email,
        phone,
        password,
      });
      if (!result.ok || !result.challenge) {
        setError(result.message ?? "We could not start registration verification.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      window.sessionStorage.setItem("lunas_registration_challenge", JSON.stringify(result.challenge));
      router.push("/register/verify");
    } catch {
      setError("Registration verification is temporarily unavailable. Please try again later.");
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthCard>
      <form onSubmit={submit} className="space-y-5" noValidate aria-busy={pending}>
        {error ? (
          <AuthAlert tone="error" title="Registration could not continue" assertive>
            {error}
            {error.includes("already exists") ? (
              <Link className="mt-1 inline-block font-semibold underline underline-offset-2" href="/login">
                Go to sign in
              </Link>
            ) : null}
          </AuthAlert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="first-name" label="First name" required value={firstName} error={fieldErrors.firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" disabled={pending} />
          <FormField id="last-name" label="Last name" required value={lastName} error={fieldErrors.lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" disabled={pending} />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-start">
          <FormField id="middle-name" label="Middle name" required={!noMiddleName} optional={noMiddleName} value={middleName} error={fieldErrors.middleName} onChange={(event) => setMiddleName(event.target.value)} autoComplete="additional-name" disabled={pending || noMiddleName} />
          <label className="flex min-h-12 items-center gap-2.5 text-sm text-slate-700 sm:mt-7">
            <input type="checkbox" checked={noMiddleName} onChange={(event) => { setNoMiddleName(event.target.checked); setFieldErrors((current) => ({ ...current, middleName: "" })); }} className="size-4 rounded border-slate-300 accent-brand-700" disabled={pending} />
            I don&apos;t have a middle name
          </label>
        </div>

        <FormField id="suffix" label="Suffix" optional value={suffix} onChange={(event) => setSuffix(event.target.value)} placeholder="Jr., Sr., III" maxLength={20} disabled={pending} />
        <FormField id="registration-email" label="Email address" required value={email} error={fieldErrors.email} onChange={(event) => setEmail(event.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" leading={<Mail className="size-4" aria-hidden="true" />} disabled={pending} />
        <FormField id="phone" label="Phone number" optional helperText="Optional Philippine mobile number." value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" placeholder="09XXXXXXXXX" disabled={pending} />

        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField id="registration-password" label="Password" required value={password} error={fieldErrors.password} helperText={passwordHint} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" disabled={pending} />
          <PasswordField id="confirm-password" label="Confirm password" required value={confirmPassword} error={fieldErrors.confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" disabled={pending} />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={pending} loadingLabel="Starting registration…">
          <UserPlus className="size-4.5" aria-hidden="true" />
          Continue to email verification
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
        <BackToLogin />
      </form>

      <SecurityNotice>Your email is used for registration verification and password recovery. Never share your verification code or password.</SecurityNotice>
    </AuthCard>
  );
}
