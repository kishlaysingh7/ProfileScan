import { BadgeCheck, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { checkVerification, startVerification } from "../lib/verificationApi";
import type { VerificationStart } from "../lib/verificationApi";
import type { PlatformId } from "../types";
import { Button } from "./ui";

export function OwnershipVerifier({
  platform,
  url,
  onVerified,
}: {
  platform: PlatformId;
  url: string;
  onVerified: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<VerificationStart | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function begin() {
    setOpen(true);
    setBusy(true);
    setError(null);
    try {
      setSession(await startVerification(platform, url));
    } catch (e) {
      setError(e instanceof TypeError ? "Could not reach the verification service." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function check() {
    if (!session) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const r = await checkVerification(session.id);
      if (r.status === "verified") {
        onVerified();
        setOpen(false);
        return;
      }
      if (r.status === "expired" || r.status === "too-many-attempts") setSession(null);
      setMessage(r.message);
    } catch (e) {
      setError(e instanceof TypeError ? "Could not reach the verification service." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" className="!px-3" onClick={begin}>
        <BadgeCheck className="h-4 w-4 text-violet-600" aria-hidden="true" /> Verify I own this
      </Button>
    );
  }

  return (
    <div className="mt-3 w-full rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
      <p className="font-semibold">Prove this profile is yours</p>
      {session ? (
        <>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Add this code to your bio or description on the profile and save it:</li>
          </ol>
          <div className="my-2 flex items-center gap-2">
            <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-base font-semibold">{session.code}</code>
            <Button variant="ghost" className="!px-2 !py-1" onClick={() => void navigator.clipboard?.writeText(session.code)} aria-label="Copy code">
              <Copy className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <ol start={2} className="list-decimal space-y-1 pl-5">
            <li>Press “Check now”. Changes can take a minute to appear.</li>
            <li>After it succeeds, you can remove the code. It expires in 30 minutes.</li>
          </ol>
        </>
      ) : (
        !busy && !error && <p className="mt-2">Starting…</p>
      )}
      {message && <p role="status" className="mt-2 text-amber-800">{message}</p>}
      {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        {session ? (
          <Button onClick={check} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Check now
          </Button>
        ) : (
          <Button onClick={begin} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Get a new code
          </Button>
        )}
        <Button variant="ghost" onClick={() => { setOpen(false); setSession(null); setMessage(null); setError(null); }}>
          Close
        </Button>
      </div>
    </div>
  );
}
