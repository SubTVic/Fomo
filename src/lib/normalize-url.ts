// SPDX-License-Identifier: AGPL-3.0-only

// Lenient normalization for URLs typed by groups ("verein.de", "@handle").
// Non-string or blank input is passed through unchanged so that the Zod
// schema behind it decides (optional field, empty string, type error).

const INSTAGRAM_HANDLE = /^@?([A-Za-z0-9._]{1,30})$/;

function trimmedString(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  return value === "" ? null : value;
}

/** "verein.de" → "https://verein.de", "https:/x.de" → "https://x.de". */
export function normalizeWebsiteUrl(raw: unknown): unknown {
  const value = trimmedString(raw);
  if (value === null) return typeof raw === "string" ? "" : raw;
  // Repair a missing slash after the scheme ("https:/x.de", "http:x.de").
  const repaired = value.replace(/^(https?):\/*/i, (_m, scheme: string) => `${scheme.toLowerCase()}://`);
  if (/^https?:\/\//i.test(repaired)) return repaired;
  // Any other explicit scheme (mailto:, javascript:, ftp://) is left alone and
  // rejected by isHttpUrl.
  if (/^[a-z][a-z0-9+.-]*:/i.test(repaired) && !/^[^:]+:\d/.test(repaired)) return repaired;
  return `https://${repaired.replace(/^\/+/, "")}`;
}

/** "aiasdresden" / "@aiasdresden" → "https://www.instagram.com/aiasdresden/". */
export function normalizeInstagramUrl(raw: unknown): unknown {
  const value = trimmedString(raw);
  if (value === null) return typeof raw === "string" ? "" : raw;
  const handle = INSTAGRAM_HANDLE.exec(value);
  if (handle) return `https://www.instagram.com/${handle[1]}/`;
  return normalizeWebsiteUrl(value);
}

/** True for absolute http(s) URLs with a dotted host name. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
