import { Bookmark } from "lucide-react";
import { ResultCard } from "../components/ResultCard";
import { EmptyState, LinkButton, PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";

export default function SavedPage() {
  const { saved, updateSavedStatus, removeSaved, markOwnershipVerified } = useApp();

  return (
    <div>
      <PageHeader
        title="Saved profiles"
        subtitle="Profiles you marked as yours or uncertain. Stored only in this browser."
      />
      {saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-10 w-10" />}
          title="Nothing saved yet"
          description="Mark a result as “It's me” or “Not sure” and it will appear here."
          action={<LinkButton to="/upload">Start a search</LinkButton>}
        />
      ) : (
        <div className="space-y-3">
          {saved.map((s) => (
            <ResultCard
              key={s.id}
              item={s}
              onStatus={(status) => updateSavedStatus(s.id, status)}
              onDelete={() => removeSaved(s.id)}
              onOwnershipVerified={() => markOwnershipVerified(s.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
