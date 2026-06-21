// SPDX-License-Identifier: AGPL-3.0-only
//
// Data-FETCHING scraper. For each group in a seed list it downloads the website
// (homepage + a likely "Über uns" subpage), extracts the text, and classifies
// it into the 17 attributes + language/eventFrequency via scrape-rules.mjs.
// Output is a scraped-groups.json that feeds derive-selfrating.mjs.
//
// IMPORTANT: the result is a *review-assist*, not ground truth (keyword quality
// is moderate — see npm run scrape:eval). Every group is flagged for review;
// low-signal/failed fetches are flagged `needsReview`. A real registration
// always overrides it. Be polite: default 1 req/s, identifies itself by UA.
//
//   node scripts/scrape-groups.mjs \
//     --seed groups-seed.json \   # [{name, websiteUrl, instagramUrl?, contactEmail?, categoryName?...}]
//     --out scraped-groups.json \
//     --delay 1000 --timeout 12000 [--limit N]
//
// The seed may also be a groups.json-shaped file ({ groups: [...] }), so you can
// re-scrape/extend an existing dataset.

import { readFileSync, writeFileSync } from "node:fs";
import { classify, htmlToText, slugify } from "./scrape-rules.mjs";

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const seedPath = getArg("--seed", "groups-seed.json");
const outPath = getArg("--out", "scraped-groups.json");
const delay = parseInt(getArg("--delay", "1000"), 10);
const timeout = parseInt(getArg("--timeout", "12000"), 10);
const limit = parseInt(getArg("--limit", "0"), 10);
const UA = "FOMO-Scraper/1.0 (+https://github.com/SubTVic/Fomo; StuRa TU Dresden)";
const MIN_SIGNAL = 3; // below this many keyword hits → flag for review

const seedRaw = JSON.parse(readFileSync(seedPath, "utf8"));
let seed = seedRaw.groups ?? seedRaw;
if (limit > 0) seed = seed.slice(0, limit);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "de,en" }, signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) return { ok: false, status: res.status, html: "" };
    const html = await res.text();
    return { ok: true, status: res.status, html };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === "AbortError" ? "timeout" : e.message, html: "" };
  } finally {
    clearTimeout(t);
  }
}

/** Find a likely "about/Über uns" link on the homepage to enrich the text. */
function findAboutUrl(html, baseUrl) {
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const wants = ["über uns", "ueber-uns", "ueber uns", "/about", "wir über", "ueber", "/verein", "was wir", "team"];
  let m;
  while ((m = re.exec(html))) {
    const href = m[1];
    const label = (m[2] + " " + href).toLowerCase();
    if (wants.some((w) => label.includes(w))) {
      try {
        return new URL(href, baseUrl).href;
      } catch {
        /* ignore bad hrefs */
      }
    }
  }
  return null;
}

function metaDescription(html) {
  const m =
    html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  return m ? m[1].trim() : null;
}
function firstEmail(text) {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0] : null;
}

const out = [];
const report = [];
let i = 0;
for (const s of seed) {
  i++;
  const name = s.name ?? "Unbekannt";
  const url = s.websiteUrl;
  process.stderr.write(`[${i}/${seed.length}] ${name} … `);

  let text = [s.name, s.shortDescription, s.longDescription].filter(Boolean).join(" ");
  let fetchedUrl = null;
  let fetchError = null;
  let html = "";

  if (url) {
    const home = await fetchText(url);
    if (home.ok) {
      fetchedUrl = url;
      html = home.html;
      const aboutUrl = findAboutUrl(home.html, url);
      if (aboutUrl && aboutUrl !== url) {
        await sleep(delay);
        const about = await fetchText(aboutUrl);
        if (about.ok) html += " " + about.html;
      }
      text += " " + htmlToText(html);
    } else {
      fetchError = home.error || `HTTP ${home.status}`;
    }
  } else {
    fetchError = "no websiteUrl in seed";
  }

  const c = classify(text);
  const needsReview = !!fetchError || c.signal < MIN_SIGNAL;
  const shortDescription =
    s.shortDescription || metaDescription(html) || text.replace(/\s+/g, " ").trim().slice(0, 200);

  out.push({
    id: s.id || slugify(name),
    name,
    slug: s.slug || slugify(name),
    shortDescription,
    longDescription: s.longDescription || shortDescription,
    categoryName: s.categoryName || "Sonstiges",
    categoryColor: s.categoryColor || null,
    categoryIcon: s.categoryIcon || "users",
    websiteUrl: url || null,
    instagramUrl: s.instagramUrl || null,
    contactEmail: s.contactEmail || firstEmail(htmlToText(html)) || null,
    memberCount: s.memberCount ?? null,
    language: c.language,
    eventFrequency: c.eventFrequency,
    groupSize: s.groupSize ?? null,
    motto: s.motto ?? null,
    foundedYear: s.foundedYear ?? null,
    logoUrl: s.logoUrl ?? null,
    attributes: c.attributes,
    _scrape: { fetchedUrl, signal: c.signal, hits: c.hits, needsReview, error: fetchError },
  });

  report.push({ name, ok: !fetchError, signal: c.signal, needsReview, error: fetchError });
  process.stderr.write(fetchError ? `FAIL (${fetchError})\n` : `ok (signal ${c.signal})\n`);
  if (i < seed.length) await sleep(delay);
}

writeFileSync(outPath, JSON.stringify({ _meta: { generatedAt: new Date().toISOString(), source: "scrape-groups.mjs", count: out.length }, groups: out }, null, 2) + "\n");

const failed = report.filter((r) => !r.ok).length;
const review = report.filter((r) => r.needsReview).length;
console.error("\n=== Scrape summary ===");
console.error(`Groups: ${out.length} | fetch failed: ${failed} | needs review (failed or low signal): ${review}`);
console.error(`Wrote → ${outPath}`);
console.error("Next: review attributes, then:");
console.error("  node scripts/derive-selfrating.mjs --in " + outPath + " --model data/derive-model.json --overrides <registration-export.json> --out data/groups.json");
console.error("  node scripts/validate-data.mjs && ./scripts/update-data.sh");
