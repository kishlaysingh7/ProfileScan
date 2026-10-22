import type { PlatformId } from "./types.js";

export interface PlatformSpec {
  id: PlatformId;
  name: string;
  /** Rules a username must satisfy on this platform before we build a direct link. */
  usernameRe: RegExp;
  profileUrl: (username: string) => string;
  searchUrl: (term: string) => string;
  /** Site restriction used for web search. */
  site: string;
  /** Extracts a username/handle from a URL when it is a profile page; null otherwise. */
  parseProfile: (url: string) => string | null;
}

const q = encodeURIComponent;

const RESERVED = new Set([
  "p", "reel", "reels", "explore", "accounts", "stories", "tv", "directory", "about", "legal",
  "home", "search", "i", "settings", "hashtag", "intent", "share", "login", "signup", "help",
  "groups", "pages", "watch", "events", "marketplace", "public", "photo", "photos", "posts",
  "people", "privacy", "policies", "gaming", "hashtag", "tags",
]);

function match(url: string, re: RegExp): string | null {
  const m = re.exec(url);
  const handle = m?.[1];
  if (!handle || RESERVED.has(handle.toLowerCase())) return null;
  return handle;
}

export const PLATFORM_SPECS: Record<PlatformId, PlatformSpec> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    usernameRe: /^[A-Za-z0-9._]{1,30}$/,
    profileUrl: (u) => `https://www.instagram.com/${u}/`,
    searchUrl: (t) => `https://www.instagram.com/explore/search/keyword/?q=${q(t)}`,
    site: "instagram.com",
    parseProfile: (url) => match(url, /^https:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?$/),
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    usernameRe: /^[A-Za-z0-9.]{5,50}$/,
    profileUrl: (u) => `https://www.facebook.com/${u}`,
    searchUrl: (t) => `https://www.facebook.com/search/people/?q=${q(t)}`,
    site: "facebook.com",
    parseProfile: (url) => match(url, /^https:\/\/(?:www\.|m\.)?facebook\.com\/([A-Za-z0-9.]{5,50})\/?$/),
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    usernameRe: /^[A-Za-z0-9_-]{3,100}$/,
    profileUrl: (u) => `https://www.linkedin.com/in/${u}/`,
    searchUrl: (t) => `https://www.linkedin.com/search/results/people/?keywords=${q(t)}`,
    site: "linkedin.com/in",
    parseProfile: (url) => match(url, /^https:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9%_-]{3,100})\/?$/),
  },
  x: {
    id: "x",
    name: "X",
    usernameRe: /^[A-Za-z0-9_]{1,15}$/,
    profileUrl: (u) => `https://x.com/${u}`,
    searchUrl: (t) => `https://x.com/search?q=${q(t)}&f=user`,
    site: "x.com",
    parseProfile: (url) => match(url, /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/),
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    usernameRe: /^[A-Za-z0-9._]{2,24}$/,
    profileUrl: (u) => `https://www.tiktok.com/@${u}`,
    searchUrl: (t) => `https://www.tiktok.com/search/user?q=${q(t)}`,
    site: "tiktok.com",
    parseProfile: (url) => match(url, /^https:\/\/(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]{2,24})\/?$/),
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    usernameRe: /^[A-Za-z0-9._-]{3,30}$/,
    profileUrl: (u) => `https://www.youtube.com/@${u}`,
    searchUrl: (t) => `https://www.youtube.com/results?search_query=${q(t)}&sp=EgIQAg%253D%253D`,
    site: "youtube.com",
    parseProfile: (url) =>
      match(url, /^https:\/\/(?:www\.)?youtube\.com\/(@[A-Za-z0-9._-]{3,30}|channel\/[A-Za-z0-9_-]+)\/?$/),
  },
  github: {
    id: "github",
    name: "GitHub",
    usernameRe: /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/,
    profileUrl: (u) => `https://github.com/${u}`,
    searchUrl: (t) => `https://github.com/search?q=${q(t)}&type=users`,
    site: "github.com",
    parseProfile: (url) => match(url, /^https:\/\/github\.com\/([A-Za-z0-9-]{1,39})\/?$/),
  },
};

export const PLATFORM_IDS = Object.keys(PLATFORM_SPECS) as PlatformId[];
