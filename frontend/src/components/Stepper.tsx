const steps = ["Photo & details", "Platforms", "Search", "Results"];

export function Stepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm" aria-label="Progress">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                active
                  ? "bg-violet-600 text-white"
                  : done
                    ? "bg-violet-200 text-violet-800"
                    : "bg-slate-200 text-slate-600"
              }`}
            >
              {n}
            </span>
            <span className={active ? "font-semibold text-slate-900" : "text-slate-500"}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
