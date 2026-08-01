import { cn, initials } from "@/lib/utils";

export function Avatar({
  firstName,
  lastName,
  size = "md",
  className,
}: {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-base",
    xl: "size-24 text-2xl",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-brand-100 font-bold text-brand-800 shadow-sm",
        sizes[size],
        className,
      )}
      aria-label={`${firstName} ${lastName} profile image`}
      role="img"
    >
      {initials(firstName, lastName)}
    </span>
  );
}
