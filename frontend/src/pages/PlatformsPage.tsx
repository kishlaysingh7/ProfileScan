import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { PlatformSelector } from "../components/PlatformSelector";
import { Stepper } from "../components/Stepper";
import { Button, LinkButton, PageHeader } from "../components/ui";
import { useApp } from "../context/AppContext";
import { PLATFORMS } from "../lib/platforms";
import { parseUsernames } from "../lib/validation";

export default function PlatformsPage() {
  const { settings, name, usernamesRaw, platforms, togglePlatform, setPlatforms, startSearch } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const searchablePlatforms = useMemo(() => PLATFORMS.filter((platform) => platform.id !== "web"), []);
  const selectedPlatforms = platforms.filter((platform) => platform !== "web");

  useEffect(() => {
    if (selectedPlatforms.length !== platforms.length) setPlatforms(selectedPlatforms);
  }, [platforms, selectedPlatforms, setPlatforms]);

  const { usernames, error: userErr } = parseUsernames(usernamesRaw);
  if (!settings.consentGiven || userErr || (!name.trim() && usernames.length === 0)) {
    return <Navigate to="/upload" replace />;
  }

  function start() {
    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform.");
      return;
    }
    startSearch(usernames);
    navigate("/progress");
  }

  const allSelected = selectedPlatforms.length === searchablePlatforms.length;

  return (
    <div>
      <Stepper current={2} />
      <PageHeader title="Choose platforms" subtitle="Select where you want to look for your public profiles." />
      <div className="mb-4 flex justify-end">
        <Button variant="ghost" onClick={() => setPlatforms(allSelected ? [] : searchablePlatforms.map((platform) => platform.id))}>
          {allSelected ? "Clear all" : "Select all"}
        </Button>
      </div>
      <PlatformSelector selected={selectedPlatforms} onToggle={(id) => { setError(null); togglePlatform(id); }} />
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-8 flex justify-between">
        <LinkButton to="/upload" variant="secondary">Back</LinkButton>
        <Button onClick={start}>Start search ({selectedPlatforms.length})</Button>
      </div>
    </div>
  );
}
