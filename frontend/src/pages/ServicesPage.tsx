import { CheckCircle2, Circle, ExternalLink, KeyRound, RefreshCw, ServerCrash, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, PageHeader, Badge } from "../components/ui";
import { getServiceCapabilities } from "../lib/serviceApi";
import type { ServiceCapabilities, ServiceState } from "../lib/serviceApi";

const services: Array<{
  key: keyof ServiceCapabilities;
  name: string;
  environmentVariable: string;
  description: string;
  setupUrl: string;
}> = [
  {
    key: "githubApi",
    name: "GitHub profile lookup",
    environmentVariable: "GITHUB_TOKEN",
    description: "Uses GitHub's API to check public GitHub accounts. A token is optional but increases the rate limit.",
    setupUrl: "https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
  },
  {
    key: "webSearch",
    name: "Public web suggestions",
    environmentVariable: "BRAVE_SEARCH_API_KEY",
    description: "Finds public profile-page suggestions through Brave Search. Results remain unverified suggestions.",
    setupUrl: "https://api.search.brave.com/",
  },
  {
    key: "googleVisionImageSearch",
    name: "Google Vision file search",
    environmentVariable: "GOOGLE_VISION_API_KEY",
    description: "Finds public pages and images with matching visual content. It never performs face recognition.",
    setupUrl: "https://cloud.google.com/vision/docs/setup",
  },
  {
    key: "serpApiImageSearch",
    name: "SerpApi public image URL search",
    environmentVariable: "SERPAPI_KEY",
    description: "Searches a user-supplied public image URL with Google Lens. It does not accept local file uploads.",
    setupUrl: "https://serpapi.com/google-lens-api",
  },
];

export default function ServicesPage() {
  const [state, setState] = useState<ServiceState>("checking");
  const [capabilities, setCapabilities] = useState<ServiceCapabilities | null>(null);

  const refresh = useCallback(async () => {
    setState("checking");
    try {
      setCapabilities(await getServiceCapabilities());
      setState("online");
    } catch {
      setCapabilities(null);
      setState("offline");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service management"
        subtitle="Review which server-side integrations are ready. Credentials are configured only on the backend and are never shown or stored in your browser."
      />

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {state === "offline" ? <ServerCrash className="h-6 w-6 text-red-600" aria-hidden="true" /> : <ShieldCheck className="h-6 w-6 text-violet-600" aria-hidden="true" />}
          <div>
            <h2 className="font-semibold">Backend connection</h2>
            <p className="text-sm text-slate-600">{state === "online" ? "Connected to the ProfileFinder API." : state === "checking" ? "Checking service availability…" : "The ProfileFinder API could not be reached."}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => void refresh()}>
          <RefreshCw className={`h-4 w-4 ${state === "checking" ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
        </Button>
      </Card>

      <div className="space-y-4">
        {services.map((service) => {
          const configured = capabilities?.[service.key] === true;
          return (
            <Card key={service.key}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    {configured ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <Circle className="h-5 w-5 text-slate-300" aria-hidden="true" />}
                    <h2 className="font-semibold">{service.name}</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                    <KeyRound className="h-4 w-4 text-violet-600" aria-hidden="true" />
                    {service.key === "googleVisionImageSearch" && capabilities?.imageSearchMode === "mock" ? (
                      <>Mock mode is enabled with <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">MOCK_IMAGE_SEARCH=true</code>.</>
                    ) : service.key === "serpApiImageSearch" ? (
                      <>Configure <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">SERPAPI_KEY</code> and set a monthly limit with <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">SERPAPI_MONTHLY_LIMIT</code>.</>
                    ) : (
                      <>Configure <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{service.environmentVariable}</code> in the backend <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">.env</code> file.</>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Badge tone={configured ? "green" : state === "offline" ? "red" : "slate"}>
                    {service.key === "googleVisionImageSearch" && capabilities?.imageSearchMode === "mock" ? "Demo mode" : configured ? "Configured" : state === "offline" ? "Status unavailable" : "Not configured"}
                  </Badge>
                  <a href={service.setupUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:underline">
                    Setup documentation <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
