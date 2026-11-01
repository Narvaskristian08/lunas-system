export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  centered = false,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={"max-w-3xl " + (centered ? "mx-auto text-center" : "")}>
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-pretty text-base leading-7 text-muted sm:text-lg">{description}</p> : null}
    </div>
  );
}
