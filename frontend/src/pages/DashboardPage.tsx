import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  Image,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { LinkButton, Card, PageHeader, Badge, Button } from "../components/ui";
import { useApp } from "../context/AppContext";
import { getServiceCapabilities } from "../lib/serviceApi";
import type { ServiceCapabilities, ServiceState } from "../lib/serviceApi";

function StateBadge({ state }: { state: ServiceState }) {
  if (state === "online") return <Badge tone="green"><CheckCircle2 className="h-3.5 w-3.5" /> Online</Badge>;
  if (state === "offline") return <Badge tone="red"><AlertCircle className="h-3.5 w-3.5" /> Unavailable</Badge>;
  return <Badge tone="amber"><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Checking</Badge>;
}

export default function DashboardPage() {
  const { job, saved } = useApp();
  const [serviceState, setServiceState] = useState<ServiceState>("checking");
  const [capabilities, setCapabilities] = useState<ServiceCapabilities | null>(null);

  const checkService = useCallback(async () => {
    setServiceState("checking");
    try {
      setCapabilities(await getServiceCapabilities());
      setServiceState("online");
    } catch {
      setCapabilities(null);
      setServiceState("offline");
    }
  }, []);

  useEffect(() => {
    void checkService();
  }, [checkService]);

  const completedPlatforms = job?.progress.filter((item) => item.state === "done").length ?? 0;
  const running = job?.status === "running";
  const serviceCards = [
    { label: "GitHub profiles", enabled: capabilities?.githubApi === true, description: "Verified profile lookups" },
    { label: "Web suggestions", enabled: capabilities?.webSearch === true, description: "Public web-search results" },
    { label: "Reverse image search", enabled: capabilities?.reverseImageSearch === true, description: "Matching public images only" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service dashboard"
        subtitle="Monitor your ProfileFinder workspace, active search, and available privacy-preserving services."
      />

      <section className="grid gap-4 md:grid-cols-[1.35fr_1fr]">
        <Card className="border-violet-100 bg-gradient-to-br from-violet-50 to-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-violet-700" aria-hidden="true" />
                <h2 className="font-semibold text-slate-900">ProfileFinder service</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">Public-profile search and ownership verification.</p>
            </div>
            <StateBadge state={serviceState} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" className="!px-3 !py-2" onClick={() => void checkService()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Refresh status
            </Button>
            <LinkButton to="/upload" className="!px-3 !py-2">
              <Search className="h-4 w-4" aria-hidden="true" /> New search
            </LinkButton>
            <LinkButton to="/services" variant="secondary" className="!px-3 !py-2">
              Manage services
            </LinkButton>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 className="font-semibold">Privacy boundary</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            No facial templates, face matching, or identity claims. Image searches only return public pages containing
            the same or visually similar image.
          </p>
        </Card>
      </section>

      <section aria-labelledby="services-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="services-heading" className="text-lg font-bold">Available services</h2>
          {serviceState === "offline" && <span className="text-sm text-red-700">Could not reach the local API.</span>}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {serviceCards.map((service) => (
            <Card key={service.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{service.label}</h3>
                  <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                </div>
                {capabilities ? (
                  service.enabled ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Available" /> :
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" aria-label="Not configured" />
                ) : <Circle className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />}
              </div>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                {service.enabled ? "Configured" : capabilities ? "Not configured" : "Status unavailable"}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-violet-600" aria-hidden="true" />
            <h2 className="font-semibold">Current search job</h2>
          </div>
          {job ? (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{running ? "Search in progress" : job.status === "completed" ? "Last search completed" : "Last search failed"}</p>
                <Badge tone={running ? "violet" : job.status === "completed" ? "green" : "red"}>
                  {running ? "Running" : job.status === "completed" ? "Completed" : "Failed"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {completedPlatforms} of {job.progress.length} services completed · {job.results.length} results received
              </p>
              <LinkButton to={running ? "/progress" : "/results"} variant="secondary" className="mt-4 !px-3 !py-2">
                View job details
              </LinkButton>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No search job in this session. Start a search when you are ready.
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Image className="h-5 w-5 text-violet-600" aria-hidden="true" />
            <h2 className="font-semibold">Saved profiles</h2>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{saved.filter((profile) => profile.status === "confirmed").length}</p>
          <p className="mt-1 text-sm text-slate-600">Profiles you marked as your own, stored only in this browser.</p>
          <LinkButton to="/collection" variant="secondary" className="mt-4 !px-3 !py-2">Open my collection</LinkButton>
        </Card>
      </section>
    </div>
  );
}
