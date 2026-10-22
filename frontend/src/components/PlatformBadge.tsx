import { PLATFORM_MAP } from "../lib/platforms";
import type { PlatformId } from "../types";

export function PlatformBadge({ id, size = 36 }: { id: PlatformId; size?: number }) {
  const p = PLATFORM_MAP[id];
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white"
      style={{ backgroundColor: p.color, width: size, height: size, fontSize: size * 0.36 }}
    >
      {p.abbr}
    </span>
  );
}
