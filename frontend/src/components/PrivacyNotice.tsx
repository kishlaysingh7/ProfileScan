import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function PrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label="Privacy notice"
      className={`rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 ${className}`}
    >
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" /> How your photo is handled
      </div>
      <ul className="list-disc space-y-1 pl-5 text-violet-900">
        <li>Use only a photo of yourself, or one you have permission to use.</li>
        <li>Your photo is <strong>not</strong> scanned for faces and no face data is created or kept.</li>
        <li>For reverse image search, the image is sent directly to the configured licensed provider and held only for that request.</li>
        <li>We never generate face data or biometric templates. Names and usernames are optional and are not used in photo-only search.</li>
      </ul>
      <Link to="/privacy" className="mt-2 inline-block font-medium underline">
        Read the privacy policy
      </Link>
    </aside>
  );
}
