import type { PlatformId } from "../types";

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  color: string;
  abbr: string;
  /** Public search page on the platform itself; no scraping involved. */
  searchUrl: (term: string) => string;
}

const q = encodeURIComponent;

export const PLATFORMS: PlatformInfo[] = [
  {
    id: "web",
    name: "Web image match",
    color: "#4F46E5",
    abbr: "Web",
    searchUrl: () => "https://images.google.com/",
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "#E1306C",
    abbr: "IG",
    searchUrl: (t) => `https://www.instagram.com/explore/search/keyword/?q=${q(t)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    color: "#1877F2",
    abbr: "f",
    searchUrl: (t) => `https://www.facebook.com/search/people/?q=${q(t)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    color: "#0A66C2",
    abbr: "in",
    searchUrl: (t) => `https://www.linkedin.com/search/results/people/?keywords=${q(t)}`,
  },
  {
    id: "x",
    name: "X",
    color: "#111827",
    abbr: "X",
    searchUrl: (t) => `https://x.com/search?q=${q(t)}&f=user`,
  },
  {
    id: "tiktok",
    name: "TikTok",
    color: "#010101",
    abbr: "Tk",
    searchUrl: (t) => `https://www.tiktok.com/search/user?q=${q(t)}`,
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    abbr: "YT",
    searchUrl: (t) => `https://www.youtube.com/results?search_query=${q(t)}&sp=EgIQAg%253D%253D`,
  },
  {
    id: "github",
    name: "GitHub",
    color: "#24292F",
    abbr: "GH",
    searchUrl: (t) => `https://github.com/search?q=${q(t)}&type=users`,
  },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p])) as Record<
  PlatformId,
  PlatformInfo
>;
