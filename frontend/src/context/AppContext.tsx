import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocalStorage } from "../lib/useLocalStorage";
import { getSearchProvider } from "../providers";
import type {
  MatchStatus,
  PlatformId,
  SavedProfile,
  SearchJob,
  UserSettings,
} from "../types";

export interface SelectedImage {
  file: File;
  previewUrl: string;
}

interface AppState {
  settings: UserSettings;
  setConsent: (given: boolean) => void;

  image: SelectedImage | null;
  setImage: (file: File | null) => void;

  name: string;
  setName: (v: string) => void;
  usernamesRaw: string;
  setUsernamesRaw: (v: string) => void;

  platforms: PlatformId[];
  togglePlatform: (id: PlatformId) => void;
  setPlatforms: (ids: PlatformId[]) => void;

  job: SearchJob | null;
  startSearch: (usernames: string[]) => void;
  startImageSearch: () => void;
  startImageUrlSearch: (imageUrl: string) => void;
  cancelSearch: () => void;

  saved: SavedProfile[];
  setResultStatus: (resultId: string, status: MatchStatus) => void;
  markOwnershipVerified: (id: string) => void;
  updateSavedStatus: (id: string, status: MatchStatus) => void;
  removeSaved: (id: string) => void;

  deleteAllData: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings, resetSettings] = useLocalStorage<UserSettings>("pf.settings", {
    consentGiven: false,
    consentRecords: [],
  });
  const [saved, setSaved, resetSaved] = useLocalStorage<SavedProfile[]>("pf.saved", []);

  const [image, setImageState] = useState<SelectedImage | null>(null);
  const [name, setName] = useState("");
  const [usernamesRaw, setUsernamesRaw] = useState("");
  const [platforms, setPlatforms] = useState<PlatformId[]>([]);
  const [job, setJob] = useState<SearchJob | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const discardImage = useCallback(() => {
    setImageState((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const setImage = useCallback((file: File | null) => {
    setImageState((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return file ? { file, previewUrl: URL.createObjectURL(file) } : null;
    });
  }, []);

  const setConsent = useCallback(
    (given: boolean) => {
      setSettings((s) => {
        if (s.consentGiven === given) return s;
        return {
          ...s,
          consentGiven: given,
          consentRecords: [...(s.consentRecords ?? []), { action: given ? "granted" : "withdrawn", recordedAt: new Date().toISOString() }],
        };
      });
      if (!given) discardImage();
    },
    [setSettings, discardImage],
  );

  const togglePlatform = useCallback((id: PlatformId) => {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }, []);

  const cancelSearch = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const startSearch = useCallback(
    (usernames: string[]) => {
      cancelSearch();
      const provider = getSearchProvider();
      const selected = platforms.filter((p) => p !== "web" && provider.supports(p));
      const query = { name: name.trim(), usernames, platforms: selected };
      const controller = new AbortController();
      abortRef.current = controller;

      setJob({
        id: crypto.randomUUID(),
        status: "running",
        providerName: provider.name,
        isDemo: provider.isDemo,
        query,
        progress: selected.map((platform) => ({ platform, state: "pending" })),
        results: [],
      });

      provider
        .search(
          query,
          (event) => {
            setJob((j) =>
              j && !controller.signal.aborted
                ? {
                    ...j,
                    progress: j.progress.map((p) =>
                      p.platform === event.platform
                        ? { ...p, state: event.state, message: event.message }
                        : p,
                    ),
                    results: event.results ? [...j.results, ...event.results] : j.results,
                  }
                : j,
            );
          },
          controller.signal,
        )
        .then(() => {
          setJob((j) => (j ? { ...j, status: "completed" } : j));
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          const message = err instanceof TypeError ? "Could not reach the search service. Please try again." : err.message || "The search could not be completed.";
          setJob((j) => (j ? { ...j, status: "failed", error: message } : j));
        })
        .finally(() => {
          // Uploaded photo is discarded once processing ends (unless it was cancelled mid-way).
          if (!controller.signal.aborted) discardImage();
        });
    },
    [platforms, name, cancelSearch, discardImage],
  );

  const startImageSearch = useCallback(() => {
              if (!image) return;
              cancelSearch();
              const controller = new AbortController();
              abortRef.current = controller;
              const query = { name: "", usernames: [], platforms: ["web"] as PlatformId[] };

              setJob({
                id: crypto.randomUUID(),
                status: "running",
                providerName: "Google Vision Web Detection",
                isDemo: false,
                query,
                progress: [{ platform: "web", state: "running", message: "Uploading image to the licensed search provider…" }],
                results: [],
              });

              const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
              let remoteJobId: string | undefined;
              const request = async <T,>(path: string, init: RequestInit) => {
                const response = await fetch(`${apiBase}${path}`, { ...init, signal: controller.signal });
                const payload = await response.json().catch(() => ({})) as { error?: string } & T;
                if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
                return payload as T;
              };

              void (async () => {
                try {
                  const created = await request<{ id: string }>("/api/image-search-jobs", {
                    method: "POST",
                    headers: { "Content-Type": image.file.type, "X-ProfileFinder-Consent": "true" },
                    body: image.file,
                  });
                  remoteJobId = created.id;
                  for (;;) {
                    const remote = await request<{
                      status: "running" | "completed" | "failed";
                      results: Array<{ id: string; url: string; displayName: string; reason: string }>;
                      message?: string;
                      providerName: string;
                      isDemo: boolean;
                    }>(`/api/image-search-jobs/${remoteJobId}`, { method: "GET" });
                    if (remote.status === "running") {
                      await new Promise<void>((resolve, reject) => {
                        const timer = setTimeout(resolve, 800);
                        controller.signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
                      });
                      continue;
                    }
                    const results = remote.results.map((result) => ({
                      ...result,
                      platform: "web" as const,
                      kind: "search-link" as const,
                      basis: "image-match" as const,
                      status: "unverified" as const,
                      verification: "unverified" as const,
                      source: remote.providerName,
                      isDemo: remote.isDemo,
                    }));
                    setJob((job) => job ? {
                      ...job,
                      status: remote.status,
                      providerName: remote.providerName,
                      isDemo: remote.isDemo,
                      progress: [{ platform: "web", state: remote.status === "completed" ? "done" : "error", message: remote.message }],
                      results,
                      error: remote.status === "failed" ? remote.message : undefined,
                    } : job);
                    return;
                  }
                } catch (error) {
                  if ((error as Error).name === "AbortError") return;
                  const message = error instanceof TypeError ? "Could not reach the reverse image search service." : (error as Error).message;
                  setJob((job) => job ? {
                    ...job,
                    status: "failed",
                    progress: [{ platform: "web", state: "error", message }],
                    error: message,
                  } : job);
                } finally {
                  if (remoteJobId) void fetch(`${apiBase}/api/image-search-jobs/${remoteJobId}`, { method: "DELETE", keepalive: true });
                  if (!controller.signal.aborted) discardImage();
                }
              })();
    }, [image, cancelSearch, discardImage]);

  const startImageUrlSearch = useCallback((imageUrl: string) => {
    cancelSearch();
    const controller = new AbortController();
    abortRef.current = controller;
    const query = { name: "", usernames: [], platforms: ["web"] as PlatformId[] };
    const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
    let remoteJobId: string | undefined;

    setJob({
      id: crypto.randomUUID(),
      status: "running",
      providerName: "SerpApi Google Lens",
      isDemo: false,
      query,
      progress: [{ platform: "web", state: "running", message: "Sending the public image URL to SerpApi Google Lens…" }],
      results: [],
    });

    const request = async <T,>(path: string, init: RequestInit) => {
      const response = await fetch(`${apiBase}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...init.headers },
      });
      const payload = await response.json().catch(() => ({})) as { error?: string } & T;
      if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status})`);
      return payload as T;
    };

    void (async () => {
      try {
        const created = await request<{ id: string }>("/api/image-url-search-jobs", {
          method: "POST",
          body: JSON.stringify({ consent: true, imageUrl }),
        });
        remoteJobId = created.id;
        for (;;) {
          const remote = await request<{
            status: "running" | "completed" | "failed";
            results: Array<{ id: string; url: string; displayName: string; reason: string }>;
            message?: string;
            providerName: string;
            isDemo: boolean;
          }>(`/api/image-search-jobs/${remoteJobId}`, { method: "GET" });
          if (remote.status === "running") {
            await new Promise<void>((resolve, reject) => {
              const timer = setTimeout(resolve, 800);
              controller.signal.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
            });
            continue;
          }
          const results = remote.results.map((result) => ({
            ...result,
            platform: "web" as const,
            kind: "search-link" as const,
            basis: "image-match" as const,
            status: "unverified" as const,
            verification: "unverified" as const,
            source: remote.providerName,
            isDemo: remote.isDemo,
          }));
          setJob((job) => job ? {
            ...job,
            status: remote.status,
            providerName: remote.providerName,
            isDemo: remote.isDemo,
            progress: [{ platform: "web", state: remote.status === "completed" ? "done" : "error", message: remote.message }],
            results,
            error: remote.status === "failed" ? remote.message : undefined,
          } : job);
          return;
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        const message = error instanceof TypeError ? "Could not reach the public-image search service." : (error as Error).message;
        setJob((job) => job ? {
          ...job,
          status: "failed",
          progress: [{ platform: "web", state: "error", message }],
          error: message,
        } : job);
      } finally {
        if (remoteJobId) void fetch(`${apiBase}/api/image-search-jobs/${remoteJobId}`, { method: "DELETE", keepalive: true });
      }
    })();
  }, [cancelSearch]);

  const setResultStatus = useCallback(
    (resultId: string, status: MatchStatus) => {
      const result = job?.results.find((r) => r.id === resultId);
      if (!result) return;
      setJob((j) =>
        j ? { ...j, results: j.results.map((r) => (r.id === resultId ? { ...r, status } : r)) } : j,
      );
      if (result.kind !== "profile") return;
      setSaved((prev) => {
        const without = prev.filter((p) => p.id !== resultId);
        if (status !== "confirmed" && status !== "uncertain") return without;
        const { kind: _kind, ...rest } = result;
        return [...without, { ...rest, status, savedAt: new Date().toISOString() }];
      });
    },
    [job, setSaved],
  );
  const markOwnershipVerified = useCallback(
    (id: string) => {
      const result = job?.results.find((r) => r.id === id);
      setJob((j) =>
        j ? { ...j, results: j.results.map((r) => (r.id === id ? { ...r, status: "confirmed", ownershipVerified: true } : r)) } : j,
      );
      setSaved((prev) => {
        if (prev.some((p) => p.id === id)) {
          return prev.map((p) => (p.id === id ? { ...p, status: "confirmed", ownershipVerified: true } : p));
        }
        if (!result || result.kind !== "profile") return prev;
        const { kind: _kind, ...rest } = result;
        return [...prev, { ...rest, status: "confirmed", ownershipVerified: true, savedAt: new Date().toISOString() }];
      });
    },
    [job, setSaved],
  );

  const updateSavedStatus = useCallback(
    (id: string, status: MatchStatus) => {
      if (status === "rejected" || status === "unverified") {
        setSaved((prev) => prev.filter((p) => p.id !== id));
      } else {
        setSaved((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
      }
      setJob((j) =>
        j ? { ...j, results: j.results.map((r) => (r.id === id ? { ...r, status } : r)) } : j,
      );
    },
    [setSaved],
  );

  const removeSaved = useCallback(
    (id: string) => {
      setSaved((prev) => prev.filter((p) => p.id !== id));
      setJob((j) =>
        j
          ? { ...j, results: j.results.map((r) => (r.id === id ? { ...r, status: "unverified" } : r)) }
          : j,
      );
    },
    [setSaved],
  );

  const deleteAllData = useCallback(() => {
    cancelSearch();
    discardImage();
    setName("");
    setUsernamesRaw("");
    setPlatforms([]);
    setJob(null);
    resetSaved();
    resetSettings();
  }, [cancelSearch, discardImage, resetSaved, resetSettings]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const value = useMemo<AppState>(
    () => ({
      settings,
      setConsent,
      image,
      setImage,
      name,
      setName,
      usernamesRaw,
      setUsernamesRaw,
      platforms,
      togglePlatform,
      setPlatforms,
      job,
      startSearch,
      startImageSearch,
      startImageUrlSearch,
      cancelSearch,
      saved,
      setResultStatus,
      markOwnershipVerified,
      updateSavedStatus,
      removeSaved,
      deleteAllData,
    }),
    [
      settings,
      setConsent,
      image,
      setImage,
      name,
      usernamesRaw,
      platforms,
      togglePlatform,
      job,
      startSearch,
      startImageSearch,
      startImageUrlSearch,
      cancelSearch,
      saved,
      setResultStatus,
      markOwnershipVerified,
      updateSavedStatus,
      removeSaved,
      deleteAllData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
