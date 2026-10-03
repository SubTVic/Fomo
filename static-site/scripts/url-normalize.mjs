// SPDX-License-Identifier: AGPL-3.0-only
//
// Normalise the free-text link fields groups type into the registration form
// ("tud.vote", "www.foo.de", "https:/foo.de", "@handle") into absolute URLs.
// Without a scheme the browser treats them as RELATIVE links — on the site
// they resolved to /groups/<slug>/tud.vote and 404'd (found in the Oct 2026
// audit). Used by export-from-backup.mjs; validate-data.mjs rejects anything
// that still isn't absolute http(s).

/** Absolute http(s) URL for a website field, or null when empty/unusable. */
export function normalizeWebUrl(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  // "https:/host" / "http:/host" (one slash) — a common typo.
  const fixed = v.replace(/^(https?):\/(?!\/)/i, "$1://");
  if (/^https?:\/\//i.test(fixed)) return fixed;
  // Bare host like "tud.vote" or "www.example.de/path".
  if (/^[^\s/@]+\.[a-z]{2,}(?:[/?#]\S*)?$/i.test(fixed)) return `https://${fixed}`;
  return v; // leave it — validate-data.mjs will flag it
}

/** Absolute Instagram URL from a URL or a bare handle ("aiasdresden", "@x"). */
export function normalizeInstagramUrl(value) {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const handle = v.match(/^@?([A-Za-z0-9._]{1,30})$/);
  // "@x.y" is always a handle; bare "x.de" is more likely a domain.
  if (handle && (v.startsWith("@") || !/\.[a-z]{2,}$/i.test(handle[1]))) {
    return `https://www.instagram.com/${handle[1]}/`;
  }
  return normalizeWebUrl(v);
}

/** True for an absolute http(s) URL the browser will not treat as relative. */
export function isAbsoluteHttpUrl(value) {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && /^https?:\/\//i.test(value);
  } catch {
    return false;
  }
}
