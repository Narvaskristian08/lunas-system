export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function formatRelativeDate(value: string) {
  const now = new Date("2026-08-01T10:30:00+08:00").getTime();
  const target = new Date(value).getTime();
  const minutes = Math.max(1, Math.round((now - target) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export function safeReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/session-expired")) return "/dashboard";
  return value;
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function passwordChecks(password: string) {
  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    notCommon: !/^(password|password123|qwerty|admin|lunas)$/i.test(password),
  };
}

export function passwordScore(password: string) {
  const checks = Object.values(passwordChecks(password)).filter(Boolean).length;
  if (!password) return 0;
  if (checks <= 2) return 1;
  if (checks <= 4) return 2;
  if (checks === 5) return 3;
  return 4;
}
