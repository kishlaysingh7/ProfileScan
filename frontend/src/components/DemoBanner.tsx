import { FlaskConical, Info } from "lucide-react";

export function DemoBanner({ providerName }: { providerName?: string }) {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        <strong>Demonstration data.</strong> {providerName ? `${providerName}: ` : ""}entries marked “Demo”
        are fabricated examples and do not exist. No external image-search provider was contacted, and the results
        must not be treated as matches.
      </p>
    </div>
  );
}

export function AccuracyNotice() {
  return (
    <div role="note" className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>
        These are suggestions, not confirmed matches. Only accounts marked “verified” were confirmed to exist
        through an official API; none are confirmed to be <em>yours</em>. ProfileFinder cannot find every account.
      </p>
    </div>
  );
}
