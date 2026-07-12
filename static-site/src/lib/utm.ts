// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Tag outbound group links with UTM parameters so the GROUPS can see
 * FOMO-referred visits in their own analytics ("utm_source=fomo-dresden").
 * This adds no tracking on our side — it only labels the referral for the
 * receiving site. Non-http(s) and unparsable URLs pass through untouched.
 */
export function withUtm(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return url;
    u.searchParams.set("utm_source", "fomo-dresden");
    u.searchParams.set("utm_medium", "referral");
    return u.toString();
  } catch {
    return url;
  }
}

/** mailto: link with a prefilled subject so groups can count FOMO enquiries. */
export function fomoMailto(email: string, lang: "de" | "en" = "de"): string {
  const subject = lang === "en" ? "Enquiry via FOMO" : "Anfrage über FOMO";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
