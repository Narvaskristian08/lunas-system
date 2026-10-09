import { Check } from "lucide-react";

export function TimelineMarker({ latest, last }: { latest: boolean; last: boolean }) {
  return (
    <span className="relative flex w-6 shrink-0 justify-center pt-0.5" aria-hidden="true">
      {!last ? <span className="absolute top-6 -bottom-6 left-1/2 w-px -translate-x-1/2 bg-slate-200" /> : null}
      {latest
        ? <span className="relative flex size-5 items-center justify-center rounded-full bg-brand-700"><Check className="size-3 stroke-[3] text-white" /></span>
        : <span className="relative flex size-5 items-center justify-center rounded-full border-[1.5px] border-brand-700 bg-white"><span className="size-2 rounded-full bg-brand-700" /></span>}
    </span>
  );
}
