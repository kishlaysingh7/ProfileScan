import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImageDropzone } from "../components/ImageDropzone";
import { PrivacyNotice } from "../components/PrivacyNotice";
import { Stepper } from "../components/Stepper";
import { Button, Card, PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { MAX_NAME_LENGTH, parseUsernames, validateName } from "../lib/validation";
import { getServiceCapabilities } from "../lib/serviceApi";
import type { ServiceCapabilities, ServiceState } from "../lib/serviceApi";

export default function UploadPage() {
  const { settings, setConsent, image, name, setName, usernamesRaw, setUsernamesRaw, startImageSearch, startImageUrlSearch } = useApp();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<{ consent?: string; name?: string; usernames?: string; imageUrl?: string; form?: string }>({});
  const [imageSearchState, setImageSearchState] = useState<ServiceState>("checking");
  const [capabilities, setCapabilities] = useState<ServiceCapabilities | null>(null);
  const [imageSearchProvider, setImageSearchProvider] = useState<"upload" | "public-url">("upload");
  const [publicImageUrl, setPublicImageUrl] = useState("");

  useEffect(() => {
    void getServiceCapabilities()
      .then((nextCapabilities) => {
        setCapabilities(nextCapabilities);
        setImageSearchState(nextCapabilities.reverseImageSearch ? "online" : "offline");
      })
      .catch(() => {
        setCapabilities(null);
        setImageSearchState("offline");
      });
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!settings.consentGiven) next.consent = "Please confirm consent to continue.";
    const usingUpload = imageSearchProvider === "upload";
    if (usingUpload && image && !capabilities?.googleVisionImageSearch) {
      next.form = imageSearchState === "checking"
        ? "Checking whether reverse image search is available. Please try again in a moment."
        : "Google Vision file search is not configured or the service is unavailable. You can still continue with a name or username.";
    }
    if (!usingUpload) {
      try {
        const url = new URL(publicImageUrl);
        if (url.protocol !== "https:") next.imageUrl = "Use a public HTTPS image URL.";
        if (url.hostname === "share.google" || url.hostname === "drive.google.com") {
          next.imageUrl = "Google sharing links are not direct image URLs. Use a public image-file URL instead.";
        }
      } catch {
        next.imageUrl = "Provide a valid public HTTPS image URL.";
      }
      if (!capabilities?.serpApiImageSearch) {
        next.form = imageSearchState === "checking"
          ? "Checking whether SerpApi is available. Please try again in a moment."
          : "SerpApi Google Lens is not configured or the service is unavailable.";
      }
    }
    const nameErr = validateName(name.trim());
    if (nameErr) next.name = nameErr;
    const { usernames, error } = parseUsernames(usernamesRaw);
    if (error) next.usernames = error;
    if (!nameErr && !error && usingUpload && !image && !name.trim() && usernames.length === 0) {
      next.form = "Upload a photo, or enter a name or username to search.";
    }
    setErrors(next);
    if (Object.keys(next).length === 0) {
      if (usingUpload && image) {
        startImageSearch();
        navigate("/progress");
      } else if (!usingUpload) {
        startImageUrlSearch(publicImageUrl);
        navigate("/progress");
      } else {
        navigate("/platforms");
      }
    }
  }

  const input =
    "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-600";

  return (
    <div>
      <Stepper current={1} />
      <PageHeader
        title="Your photo and details"
        subtitle="Upload a photo with Google Vision or search a public image URL with SerpApi. Name and username are optional."
      />
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 font-semibold">Reverse image search</h2>
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="image-provider" checked={imageSearchProvider === "upload"} onChange={() => setImageSearchProvider("upload")} className="accent-violet-600" />
                Upload a file — Google Vision
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input type="radio" name="image-provider" checked={imageSearchProvider === "public-url"} onChange={() => setImageSearchProvider("public-url")} className="accent-violet-600" />
                Public image URL — SerpApi Google Lens
              </label>
            </div>
            {imageSearchProvider === "upload" ? (
              <>
                <ImageDropzone disabled={!settings.consentGiven || !capabilities?.googleVisionImageSearch} />
                <p className="mt-2 text-sm text-slate-500">Uploads are sent only for one Google Vision Web Detection request.</p>
              </>
            ) : (
              <div>
                <label htmlFor="public-image-url" className="text-sm font-medium text-slate-700">Public HTTPS image URL</label>
                <input id="public-image-url" type="url" value={publicImageUrl} onChange={(e) => setPublicImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" className={input} aria-invalid={!!errors.imageUrl} aria-describedby="public-image-url-help" />
                <p id="public-image-url-help" className="mt-1 text-xs text-slate-500">SerpApi fetches this URL directly. Only use an image that is already public and that you may search.</p>
                {errors.imageUrl && <p role="alert" className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
              </div>
            )}
            {!settings.consentGiven && <p className="mt-2 text-sm text-slate-500">Confirm consent below to enable image search.</p>}
            {settings.consentGiven && imageSearchState === "checking" && <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking reverse image search availability…</p>}
            {settings.consentGiven && imageSearchState === "offline" && (
              <p className="mt-2 flex items-start gap-2 text-sm text-amber-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {imageSearchProvider === "public-url"
                  ? "SerpApi Google Lens is not configured or the service is unavailable. Add SERPAPI_KEY to backend/.env and restart the backend."
                  : "Google Vision file search is not configured or the service is unavailable. Add GOOGLE_VISION_API_KEY to backend/.env and restart the backend."}
              </p>
            )}
          </Card>

          <Card className="space-y-4">
            <h2 className="font-semibold">Search details (optional)</h2>
            <div>
              <label htmlFor="name" className="text-sm font-medium text-slate-700">Name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={MAX_NAME_LENGTH + 20} autoComplete="name" placeholder="e.g. Alex Morgan" className={input} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
              {errors.name && <p id="name-err" role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="usernames" className="text-sm font-medium text-slate-700">Username variations</label>
              <input id="usernames" value={usernamesRaw} onChange={(e) => setUsernamesRaw(e.target.value)} placeholder="alexmorgan, alex.morgan, amorgan" className={input} aria-invalid={!!errors.usernames} aria-describedby="usernames-help" />
              <p id="usernames-help" className="mt-1 text-xs text-slate-500">Separate with commas or spaces. Up to 5.</p>
              {errors.usernames && <p role="alert" className="mt-1 text-sm text-red-600">{errors.usernames}</p>}
            </div>
            {errors.form && <p role="alert" className="text-sm text-red-600">{errors.form}</p>}
          </Card>

          <Card>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={settings.consentGiven}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-5 w-5 accent-violet-600"
                aria-describedby={errors.consent ? "consent-err" : undefined}
              />
              <span className="text-sm text-slate-700">
                I confirm that I have permission to use any photo I upload or to search for the profiles of the
                person described. I will use results only for lawful purposes and I understand ProfileFinder does
                not identify people from their faces.
              </span>
            </label>
            {errors.consent && <p id="consent-err" role="alert" className="mt-2 text-sm text-red-600">{errors.consent}</p>}
          </Card>

          <div className="flex justify-end">
            <Button type="submit">{imageSearchProvider === "public-url" || image ? "Search this image" : "Continue to platforms"}</Button>
          </div>
        </div>

        <PrivacyNotice className="h-fit lg:sticky lg:top-24" />
      </form>
    </div>
  );
}
