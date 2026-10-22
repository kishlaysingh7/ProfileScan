import type { ReactNode } from "react";
import { Card, LinkButton, PageHeader } from "../components/ui";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <div>
      <PageHeader title="Privacy policy" subtitle="Draft for the Phase 1 preview – to be reviewed by legal counsel before launch." />
      <Card className="space-y-6">
        <Section title="What we process">
          <p>The name and usernames you type are sent to our server to run the search and are not stored; the job is deleted after the search. A photo you add stays in your browser and is never uploaded.</p>
        </Section>
        <Section title="Your photo">
          <p>
            Photos are kept in browser memory only, are never uploaded or analysed for faces, and are discarded when the search finishes.
            We do not create or retain face embeddings or biometric templates. We never sell or share uploaded images.
          </p>
        </Section>
        <Section title="Saved profiles">
          <p>Profile links you confirm are stored so you can organise them. They are stored in your browser only.</p>
        </Section>
        <Section title="Your controls">
          <p>You can withdraw consent, delete saved profiles, or delete all data at any time from Settings.</p>
        </Section>
        <Section title="Limitations">
          <p>Suggestions may be incomplete or wrong. We never claim to find every account. Searches use GitHub's API and, if configured, a licensed web-search API, and link to platforms' own public pages.</p>
        </Section>
      </Card>
    </div>
  );
}

export function TermsPage() {
  return (
    <div>
      <PageHeader title="Terms of service" subtitle="Draft for the Phase 1 preview – to be reviewed by legal counsel before launch." />
      <Card className="space-y-6">
        <Section title="Permitted use">
          <p>Use ProfileFinder only to look up your own public profiles, or those of a person who has given you permission.</p>
        </Section>
        <Section title="Prohibited use">
          <p>
            Do not use the service to identify, track, stalk, harass, or profile other people, or to bypass any platform
            restriction. ProfileFinder does not identify strangers from photos.
          </p>
        </Section>
        <Section title="No guarantees">
          <p>Results are suggestions provided “as is”. You are responsible for verifying them.</p>
        </Section>
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you’re looking for doesn’t exist.</p>
      <LinkButton to="/" className="mt-6">Back to home</LinkButton>
    </div>
  );
}
