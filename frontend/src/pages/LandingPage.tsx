import { ArrowRight, BadgeCheck, FlaskConical, Lock, ShieldOff, Trash2 } from "lucide-react";
import { PlatformBadge } from "../components/PlatformBadge";
import { LinkButton } from "../components/ui";
import { PLATFORMS } from "../lib/platforms";

const principles = [
  { icon: BadgeCheck, title: "Consent first", text: "You confirm you may use the photo and search before anything starts." },
  { icon: ShieldOff, title: "No face recognition", text: "We never scan faces, build face templates, or identify strangers." },
  { icon: Trash2, title: "Photos are discarded", text: "Your image is removed as soon as the search finishes." },
  { icon: Lock, title: "You stay in control", text: "Review every suggestion and delete your saved data at any time." },
];

export default function LandingPage() {
  return (
    <div className="space-y-14">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-14 text-center text-white shadow-lg sm:px-12">
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Find and organize your own public social profiles
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-violet-100">
          Tell us who you are, pick the platforms you care about, and review a list of possible public profile
          links. You decide what is really yours.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton to="/upload" className="!bg-white !text-violet-700 hover:!bg-violet-50">
            Continue as guest <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </LinkButton>
          <LinkButton to="/dashboard" variant="secondary" className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">
            Open dashboard
          </LinkButton>
          <span
            aria-disabled="true"
            className="inline-flex items-center rounded-xl border border-white/40 px-4 py-2.5 text-sm font-semibold text-white/80"
            title="Email accounts are not available yet"
          >
            Accounts · coming soon
          </span>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-violet-100">
          <FlaskConical className="h-4 w-4" aria-hidden="true" /> Suggestions are unverified unless marked otherwise.
        </p>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="mb-6 text-center text-2xl font-bold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-4">
          {["Confirm consent and add your details", "Choose platforms", "We search permitted public sources", "You review and confirm"].map(
            (t, i) => (
              <li key={t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 font-bold text-violet-700">
                  {i + 1}
                </span>
                <p className="font-medium text-slate-800">{t}</p>
              </li>
            ),
          )}
        </ol>
      </section>

      <section aria-labelledby="privacy">
        <h2 id="privacy" className="mb-6 text-center text-2xl font-bold">Built around your privacy</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {principles.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Icon className="h-6 w-6 shrink-0 text-violet-600" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="platforms" className="text-center">
        <h2 id="platforms" className="mb-5 text-2xl font-bold">Supported platforms</h2>
        <ul className="flex flex-wrap justify-center gap-3">
          {PLATFORMS.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-medium shadow-sm">
              <PlatformBadge id={p.id} size={28} /> {p.name}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-6 max-w-xl text-sm text-slate-500">
          ProfileFinder cannot guarantee to find every account, and suggestions may be wrong. Nothing is shown as
          confirmed until you confirm it.
        </p>
      </section>
    </div>
  );
}
