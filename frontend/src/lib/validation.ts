export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_NAME_LENGTH = 80;
export const MAX_USERNAMES = 5;

const USERNAME_RE = /^[A-Za-z0-9._-]{1,30}$/;

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Unsupported file type. Please upload a JPG, PNG, or WEBP image.";
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_IMAGE_BYTES) {
    return `This image is too large. The maximum size is ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export function validateName(name: string): string | null {
  if (name.length > MAX_NAME_LENGTH) return `Name must be at most ${MAX_NAME_LENGTH} characters.`;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f<>]/.test(name)) return "Name contains unsupported characters.";
  return null;
}

/** Parses a comma/space separated list. Returns cleaned usernames and an error if any is invalid. */
export function parseUsernames(raw: string): { usernames: string[]; error: string | null } {
  const parts = raw
    .split(/[\s,]+/)
    .map((p) => p.trim().replace(/^@/, ""))
    .filter(Boolean);
  const unique = [...new Set(parts)];
  if (unique.length > MAX_USERNAMES) {
    return { usernames: [], error: `Enter at most ${MAX_USERNAMES} usernames.` };
  }
  const bad = unique.find((u) => !USERNAME_RE.test(u));
  if (bad) {
    return {
      usernames: [],
      error: `"${bad}" is not a valid username. Use letters, numbers, dots, dashes, or underscores (max 30).`,
    };
  }
  return { usernames: unique, error: null };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
