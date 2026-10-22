import { Check, CircleHelp, Copy, ExternalLink, Trash2, X } from "lucide-react";
import { useState } from "react";
import { PLATFORM_MAP } from "../lib/platforms";
import type { MatchBasis, MatchStatus, ResultKind, SearchResult } from "../types";
import { OwnershipVerifier } from "./OwnershipVerifier";
import { PlatformBadge } from "./PlatformBadge";
import { Badge, Button } from "./ui";

export const STATUS_LABEL: Record<MatchStatus, string> = {
  unverified: "Not reviewed",
  confirmed: "User confirmed",
  uncertain: "Uncertain",
  rejected: "Rejected",
};

const STATUS_TONE = { unverified: "slate", confirmed: "green", uncertain: "amber", rejected: "red" } as const;

const BASIS_LABEL: Record<MatchBasis, string> = {
  "username-exact": "Exact username match",
  "username-similar": "Similar username",
  "name-based": "Name-based",
  "platform-search": "Platform search link",
  "image-match": "Image match",
};

type CardItem = Pick<
  SearchResult,
  "id" | "platform" | "url" | "username" | "displayName" | "reason" | "basis" | "status" | "isDemo" | "verification" | "ownershipVerified"
> & { kind?: ResultKind };

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function ResultCard({
  item,
  onStatus,
  onDelete,
  onOwnershipVerified,
}: {
  item: CardItem;
  onStatus?: (status: MatchStatus) => void;
  onDelete?: () => void;
  onOwnershipVerified?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const platform = PLATFORM_MAP[item.platform];
  const safe = isSafeUrl(item.url);
  const isProfile = item.kind !== "search-link";

  async function copy() {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <PlatformBadge id={item.platform} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">
              {isProfile ? (item.displayName ?? item.username ?? platform.name) : `${platform.name} public search`}
            </h3>
            <span className="text-sm text-slate-500">{platform.name}</span>
            {item.isDemo && <Badge tone="amber">Demo</Badge>}
            {isProfile && item.ownershipVerified && item.status === "confirmed" && <Badge tone="green">Ownership verified</Badge>}
            {isProfile && !item.isDemo && item.verification === "verified" && <Badge tone="green">Account exists (verified)</Badge>}
            {isProfile && !item.isDemo && item.verification !== "verified" && <Badge>Not verified</Badge>}
            {isProfile && <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>}
          </div>
          {item.username && <p className="text-sm text-slate-600">@{item.username}</p>}
          <p className="mt-1 break-all text-sm text-violet-700">{item.url}</p>
          <p className="mt-2 text-sm text-slate-600">
            <Badge tone="violet">{BASIS_LABEL[item.basis]}</Badge> <span className="ml-1">{item.reason}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {safe && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {isProfile ? "Open profile" : "Open search"}
          </a>
        )}
        <Button variant="secondary" onClick={copy} className="!px-3">
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Copied" : "Copy URL"}
        </Button>

        {isProfile && onStatus && (
          <div className="ml-auto flex flex-wrap gap-2" role="group" aria-label="Review this profile">
            <Button variant="secondary" className="!px-3" aria-pressed={item.status === "confirmed"} onClick={() => onStatus("confirmed")}>
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> It's me
            </Button>
            <Button variant="secondary" className="!px-3" aria-pressed={item.status === "uncertain"} onClick={() => onStatus("uncertain")}>
              <CircleHelp className="h-4 w-4 text-amber-600" aria-hidden="true" /> Not sure
            </Button>
            <Button variant="secondary" className="!px-3" aria-pressed={item.status === "rejected"} onClick={() => onStatus("rejected")}>
              <X className="h-4 w-4 text-red-600" aria-hidden="true" /> Incorrect
            </Button>
          </div>
        )}
        {isProfile && item.platform !== "web" && !item.isDemo && onOwnershipVerified && !(item.ownershipVerified && item.status === "confirmed") && (
          <OwnershipVerifier platform={item.platform} url={item.url} onVerified={onOwnershipVerified} />
        )}
        {onDelete && (
          <Button variant="ghost" className="!px-3 text-red-700" onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
          </Button>
        )}
      </div>
    </article>
  );
}
