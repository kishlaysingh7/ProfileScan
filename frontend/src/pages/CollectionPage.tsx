import { BadgeCheck, BookmarkCheck, ShieldCheck } from "lucide-react";
import { ResultCard } from "../components/ResultCard";
import { EmptyState, LinkButton, PageHeader, Badge } from "../components/ui";
import { useApp } from "../context/AppContext";

export default function CollectionPage() {
  const { saved, settings, updateSavedStatus, removeSaved, markOwnershipVerified } = useApp();
  const ownedProfiles = saved.filter((profile) => profile.status === "confirmed");
  const verifiedProfiles = ownedProfiles.filter((profile) => profile.ownershipVerified);
  const latestConsent = settings.consentRecords?.at(-1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile collection"
        subtitle="Profiles you have identified as your own. This collection is stored only in this browser."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <BookmarkCheck className="h-5 w-5 text-violet-600" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold">{ownedProfiles.length}</p>
          <p className="text-sm text-slate-600">Profiles in collection</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <BadgeCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
          <p className="mt-3 text-2xl font-bold">{verifiedProfiles.length}</p>
          <p className="text-sm text-slate-600">Ownership verified</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-violet-600" aria-hidden="true" />
          <div className="mt-3">
            <Badge tone={settings.consentGiven ? "green" : "amber"}>
              {settings.consentGiven ? "Consent active" : "Consent not active"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {latestConsent ? `Last updated ${new Date(latestConsent.recordedAt).toLocaleString()}` : "No consent record yet"}
          </p>
        </div>
      </section>

      {ownedProfiles.length === 0 ? (
        <EmptyState
          icon={<BookmarkCheck className="h-10 w-10" />}
          title="Your collection is empty"
          description="Mark a suggested profile as “It's me” after checking it, and it will appear here."
          action={<LinkButton to="/upload">Start a search</LinkButton>}
        />
      ) : (
        <section aria-labelledby="profiles-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="profiles-heading" className="text-lg font-bold">Owned profiles</h2>
            <LinkButton to="/saved" variant="secondary" className="!px-3 !py-2">View all saved</LinkButton>
          </div>
          <div className="space-y-3">
            {ownedProfiles.map((profile) => (
              <ResultCard
                key={profile.id}
                item={profile}
                onStatus={(status) => updateSavedStatus(profile.id, status)}
                onDelete={() => removeSaved(profile.id)}
                onOwnershipVerified={() => markOwnershipVerified(profile.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
