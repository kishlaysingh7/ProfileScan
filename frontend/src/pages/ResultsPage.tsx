import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { AccuracyNotice, DemoBanner } from "../components/DemoBanner";
import { ResultCard, STATUS_LABEL } from "../components/ResultCard";
import { Stepper } from "../components/Stepper";
import { EmptyState, LinkButton, PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { PLATFORM_MAP } from "../lib/platforms";
import type { MatchStatus, PlatformId } from "../types";

export default function ResultsPage() {
  const { job, setResultStatus, markOwnershipVerified } = useApp();
  const [platformFilter, setPlatformFilter] = useState<PlatformId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "all">("all");

  const filtered = useMemo(
    () =>
      (job?.results ?? []).filter(
        (r) =>
          (platformFilter === "all" || r.platform === platformFilter) &&
          (statusFilter === "all" || r.status === statusFilter),
      ),
    [job, platformFilter, statusFilter],
  );

  if (!job) {
    return (
      <EmptyState
        icon={<SearchX className="h-10 w-10" />}
        title="No search yet"
        description="Start a search to see suggested public profile links here."
        action={<LinkButton to="/upload">Start a search</LinkButton>}
      />
    );
  }

  const select = "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-violet-600";

  return (
    <div>
      <Stepper current={4} />
      <PageHeader
        title="Results"
        subtitle="These are suggestions only. Open each link, check it yourself, then mark it. Nothing is confirmed until you say so."
      />
      <div className="mb-4 space-y-3">
        {job.isDemo ? <DemoBanner providerName={job.providerName} /> : <AccuracyNotice />}
        <p className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
          Your uploaded photo has been discarded now that the search is finished.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">
          Platform{" "}
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value as PlatformId | "all")} className={select}>
            <option value="all">All</option>
            {job.query.platforms.map((p) => (
              <option key={p} value={p}>{PLATFORM_MAP[p].name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Status{" "}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MatchStatus | "all")} className={select}>
            <option value="all">All</option>
            {(Object.keys(STATUS_LABEL) as MatchStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-sm text-slate-500" aria-live="polite">{filtered.length} shown</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-10 w-10" />}
          title="No results to show"
          description="Nothing matches the current filters, or no candidates were suggested. This does not mean you have no accounts."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ResultCard key={r.id} item={r} onStatus={(s) => setResultStatus(r.id, s)} onOwnershipVerified={() => markOwnershipVerified(r.id)} />
          ))}
        </div>
      )}
      <div className="mt-8 flex justify-between">
        <LinkButton to="/platforms" variant="secondary">Change platforms</LinkButton>
        <LinkButton to="/saved">View saved profiles</LinkButton>
      </div>
    </div>
  );
}
