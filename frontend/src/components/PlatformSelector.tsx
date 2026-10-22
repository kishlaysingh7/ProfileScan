import { Check } from "lucide-react";
import { PLATFORMS } from "../lib/platforms";
import type { PlatformId } from "../types";
import { PlatformBadge } from "./PlatformBadge";

export function PlatformSelector({
  selected,
  onToggle,
}: {
  selected: PlatformId[];
  onToggle: (id: PlatformId) => void;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {PLATFORMS.filter((p) => p.id !== "web").map((p) => {
        const on = selected.includes(p.id);
        return (
          <li key={p.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => onToggle(p.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
                on ? "border-violet-500 bg-violet-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <PlatformBadge id={p.id} />
              <span className="flex-1 font-semibold text-slate-900">{p.name}</span>
              <span
                aria-hidden="true"
                className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                  on ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white"
                }`}
              >
                {on && <Check className="h-4 w-4" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
