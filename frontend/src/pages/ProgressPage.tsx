import { AlertCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { DemoBanner } from "../components/DemoBanner";
import { PlatformBadge } from "../components/PlatformBadge";
import { Stepper } from "../components/Stepper";
import { Button, Card, PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { PLATFORM_MAP } from "../lib/platforms";
import type { PlatformProgressState } from "../types";

const STATE_TEXT: Record<PlatformProgressState, string> = {
  pending: "Waiting",
  running: "Searching…",
  done: "Done",
  error: "Failed",
};

function StateIcon({ state }: { state: PlatformProgressState }) {
  const c = "h-5 w-5";
  if (state === "running") return <Loader2 className={`${c} animate-spin text-violet-600`} aria-hidden="true" />;
  if (state === "done") return <CheckCircle2 className={`${c} text-emerald-600`} aria-hidden="true" />;
  if (state === "error") return <AlertCircle className={`${c} text-red-600`} aria-hidden="true" />;
  return <Circle className={`${c} text-slate-300`} aria-hidden="true" />;
}

export default function ProgressPage() {
  const { job, cancelSearch } = useApp();
  const navigate = useNavigate();

  if (!job) return <Navigate to="/upload" replace />;

  const finished = job.progress.filter((p) => p.state === "done" || p.state === "error").length;
  const running = job.status === "running";

  return (
    <div>
      <Stepper current={3} />
      <PageHeader title={running ? "Searching…" : "Search complete"} subtitle={job.query.platforms[0] === "web" ? "Your image is sent only to the configured licensed reverse-image provider. No face data is generated." : "Each platform below is updated only when its search actually finishes."} />
      {job.isDemo && <div className="mb-4"><DemoBanner providerName={job.providerName} /></div>}
      <Card>
        <p className="mb-4 text-sm text-slate-600" aria-live="polite">
          {finished} of {job.progress.length} platforms finished
        </p>
        <ul className="divide-y divide-slate-100">
          {job.progress.map((p) => (
            <li key={p.platform} className="flex items-center gap-3 py-3">
              <PlatformBadge id={p.platform} size={32} />
              <span className="flex-1 font-medium">{PLATFORM_MAP[p.platform].name}</span>
              <span className="text-sm text-slate-600">{p.message ?? STATE_TEXT[p.state]}</span>
              <StateIcon state={p.state} />
            </li>
          ))}
        </ul>
        {job.error && <p role="alert" className="mt-3 text-sm text-red-600">{job.error}</p>}
      </Card>
      <div className="mt-6 flex justify-between">
        {running ? (
          <Button variant="secondary" onClick={() => { cancelSearch(); navigate("/upload"); }}>
            Cancel search
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => navigate(job.query.platforms[0] === "web" ? "/upload" : "/platforms")}>Back</Button>
        )}
        <Button disabled={running} onClick={() => navigate("/results")}>View results</Button>
      </div>
    </div>
  );
}
