const teamMembers = [
  { name: "Lafuente, Mark Anthony", initials: "LM" },
  { name: "Lappay, Terrence", initials: "LT" },
  { name: "Narvas, Kristian Dave", initials: "NK" },
  { name: "Ungos, John Miller", initials: "UJ" },
  { name: "Viari, Mark Khean M.", initials: "VM" },
];

export function TeamGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {teamMembers.map(({ name, initials }) => (
        <li key={name} className="marketing-card-hover flex min-h-20 items-center gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-extrabold tracking-wide text-brand-800">
            {initials}
          </span>
          <span className="font-semibold text-foreground">{name}</span>
        </li>
      ))}
    </ul>
  );
}
