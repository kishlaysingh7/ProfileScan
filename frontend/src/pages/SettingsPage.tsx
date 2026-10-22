import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button, Card, PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";

export default function SettingsPage() {
  const { settings, setConsent, saved, deleteAllData } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader title="Privacy & settings" subtitle="Manage consent, retention, and your data." />

      <Card className="space-y-3">
        <h2 className="font-semibold">Consent</h2>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input type="checkbox" checked={settings.consentGiven} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-violet-600" />
          I have permission to use the photos I upload and to search for the profiles of the person described.
        </label>
        <p className="text-sm text-slate-500">Withdrawing consent immediately discards any photo held in this browser tab.</p>
        {settings.consentRecords?.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <h3 className="text-sm font-medium text-slate-700">Consent record</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {[...settings.consentRecords].reverse().map((record) => (
                <li key={`${record.action}-${record.recordedAt}`}>
                  Consent {record.action} · {new Date(record.recordedAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Retention</h2>
        <label className="flex items-start gap-3 text-sm text-slate-500">
          <input type="checkbox" disabled className="mt-0.5 h-5 w-5" />
          <span>
            Keep my photo after a search <em>(not available — images are always deleted after processing)</em>
          </span>
        </label>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Uploaded photos live in browser memory only, are never sent to a server, and are discarded when the search finishes.</li>
          <li>No face embeddings or biometric templates are ever created.</li>
          <li>Saved profiles ({saved.length}) are stored in this browser only.</li>
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Delete my data</h2>
        <p className="text-sm text-slate-600">
          Removes your photo, search details, results, saved profiles, and settings from this browser.
        </p>
        {deleted && (
          <p role="status" className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> All data deleted.
          </p>
        )}
        {confirming ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="danger" onClick={() => { deleteAllData(); setConfirming(false); setDeleted(true); }}>
              Yes, delete everything
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => { setDeleted(false); setConfirming(true); }}>Delete all my data</Button>
        )}
      </Card>
    </div>
  );
}
