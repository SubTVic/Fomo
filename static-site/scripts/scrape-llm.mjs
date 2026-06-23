// SPDX-License-Identifier: AGPL-3.0-only
//
// LLM data scraper for the static FOMO version. For each group in a seed list
// it downloads the website (homepage + a likely "Über uns" subpage), extracts
// the text, and asks Claude to answer the WS2 quiz items the way a member of
// that group would — producing DIRECTLY what the matcher uses:
//   selfRating.answers (one -1|0|1 per quiz item) + selfRating.filterSelections.
// The legacy 17 binary attributes are NOT produced — the static site ignores
// them. The item set + filters are read from quiz.json, so this stays generic
// for a future working-set-v3.
//
// Why an LLM in addition to the keyword scraper (scrape-groups.mjs)? Keyword
// matching is precise but blind to phrasing it has not seen; an LLM reads the
// "Über uns" prose and judges intent. The keyword classifier
// (classifyToSelfRating) is kept as an OFFLINE FALLBACK: if no API key is set,
// or a group's request fails / returns unusable JSON, we fall back to it so the
// run never produces garbage. Every group stays flagged derived + needsReview;
// a real registration always overrides it (see derive-selfrating.mjs).
//
// Honesty rule baked into the prompt: answer 0 (neutral) whenever the page
// gives no clear evidence — never guess. A wrong non-neutral answer hurts
// matching more than a neutral one, so "no data" must read as neutral.
//
//   ANTHROPIC_API_KEY=sk-... \
//   node scripts/scrape-llm.mjs \
//     --seed groups-seed.json \   # [{name, websiteUrl, instagramUrl?, categoryName?...}]
//     --quiz data/quiz.json \
//     --out scraped-groups.json \
//     --model claude-opus-4-8 \
//     --delay 1000 --timeout 12000 [--limit N] [--offline]
//
// Requires: npm install  (adds @anthropic-ai/sdk, see package.json).

import { readFileSync, writeFileSync } from "node:fs";
import { classifyToSelfRating, htmlToText, slugify } from "./scrape-rules.mjs";

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const hasFlag = (n) => args.includes(n);

const seedPath = getArg("--seed", "groups-seed.json");
const quizPath = getArg("--quiz", "data/quiz.json");
const outPath = getArg("--out", "scraped-groups.json");
const model = getArg("--model", "claude-opus-4-8");
const delay = parseInt(getArg("--delay", "1000"), 10);
const timeout = parseInt(getArg("--timeout", "12000"), 10);
const limit = parseInt(getArg("--limit", "0"), 10);
const maxChars = parseInt(getArg("--max-chars", "14000"), 10);
const offline = hasFlag("--offline"); // force keyword fallback, never call the API
const UA = "FOMO-Scraper/1.0 (+https://github.com/SubTVic/Fomo; StuRa TU Dresden)";

const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
const seedRaw = JSON.parse(readFileSync(seedPath, "utf8"));
let seed = seedRaw.groups ?? seedRaw;
if (limit > 0) seed = seed.slice(0, limit);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VALID_ITEM_IDS = new Set(quiz.items.map((i) => i.id));
const VALID_FILTERS = new Set((quiz.filters?.options ?? []).map((o) => o.attribute));
const clampAns = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

// --- Claude client (lazy: only constructed when we actually call the API) ----
let client = null;
let llmEnabled = !offline && !!process.env.ANTHROPIC_API_KEY;
async function getClient() {
  if (client) return client;
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment
  return client;
}

// --- page fetching (self-contained, polite) ----------------------------------
async function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "de,en" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    if (!res.ok) return { ok: false, status: res.status, html: "" };
    return { ok: true, status: res.status, html: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === "AbortError" ? "timeout" : e.message, html: "" };
  } finally {
    clearTimeout(t);
  }
}

function findAboutUrl(html, baseUrl) {
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const wants = ["über uns", "ueber-uns", "ueber uns", "/about", "wir über", "ueber", "/verein", "was wir", "team"];
  let m;
  while ((m = re.exec(html))) {
    const label = (m[2] + " " + m[1]).toLowerCase();
    if (wants.some((w) => label.includes(w))) {
      try {
        return new URL(m[1], baseUrl).href;
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

// --- prompt construction ------------------------------------------------------
const VALUE_MAP_FIELDS = ["groupSize", "eventFrequency", "language"];

function buildPrompt(name, text) {
  const itemLines = quiz.items
    .map((i) => `  "${i.id}": ${JSON.stringify(i.text)}${i.shortTitle ? `   // ${i.shortTitle}` : ""}`)
    .join("\n");
  const filterLines = (quiz.filters?.options ?? [])
    .map((o) => `  "${o.attribute}": ${JSON.stringify(o.label)}`)
    .join("\n");

  return `Du klassifizierst eine Dresdner Hochschulgruppe für eine Matching-App, die Erstis passende Gruppen vorschlägt. Unten steht der Webseiten-Text der Gruppe "${name}".

Beantworte jede Quiz-Aussage SO, WIE EIN MITGLIED DIESER GRUPPE sie beantworten würde — also: wie sehr trifft die Aussage auf diese Gruppe zu?
  1  = trifft klar zu (der Text belegt es deutlich)
  -1 = trifft klar NICHT zu (der Text belegt das Gegenteil deutlich)
  0  = unklar / kein Beleg im Text

WICHTIGSTE REGEL: Wähle 0, sobald der Text keinen klaren Beleg liefert. Rate NICHT. Eine falsche 1 oder -1 schadet dem Matching mehr als eine ehrliche 0. Lieber viele Nullen als geratene Werte.

QUIZ-AUSSAGEN (itemId → Aussage):
{
${itemLines}
}

FILTER (Aktivitäts-Kategorien): Gib in "filterSelections" die attribute-Keys der Kategorien an, die die Gruppe NACHWEISLICH anbietet (sonst leer lassen):
{
${filterLines}
}

FELDER:
- "groupSize": "small" | "medium" | "large" | null   (null wenn unklar)
- "eventFrequency": "high" | "medium" | "low" | null  (high=wöchentlich+, low=monatlich-/selten)
- "language": "german" | "english" | "both" | null    ("both"/"english" nur bei klarem internationalem/englischem Bezug)

Antworte mit AUSSCHLIESSLICH einem JSON-Objekt, keine Erklärung, kein Markdown:
{"answers": {"<itemId>": <-1|0|1>, ...},"filterSelections": ["<attribute>", ...],"fields": {"groupSize": ..., "eventFrequency": ..., "language": ...}}

WEBSEITEN-TEXT:
"""
${text.slice(0, maxChars)}
"""`;
}

function extractJson(s) {
  // The model is asked for pure JSON, but be defensive: grab the first {...} block.
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in response");
  return JSON.parse(s.slice(start, end + 1));
}

/** Normalise a raw LLM object into the selfRating shape, dropping unknown keys. */
function normalizeLlm(raw) {
  const ansMap = raw.answers && typeof raw.answers === "object" ? raw.answers : {};
  const answers = quiz.items.map((item) => ({
    itemId: item.id,
    value: clampAns(Number(ansMap[item.id] ?? 0) || 0),
  }));
  const filterSelections = Array.isArray(raw.filterSelections)
    ? [...new Set(raw.filterSelections.filter((a) => VALID_FILTERS.has(a)))]
    : [];
  const f = raw.fields && typeof raw.fields === "object" ? raw.fields : {};
  const oneOf = (v, allowed) => (allowed.includes(v) ? v : null);
  const fields = {
    groupSize: oneOf(f.groupSize, ["small", "medium", "large"]),
    eventFrequency: oneOf(f.eventFrequency, ["high", "medium", "low"]) ?? "medium",
    language: oneOf(f.language, ["german", "english", "both"]) ?? "german",
  };
  const nonNeutral = answers.filter((a) => a.value !== 0).length;
  return { answers, filterSelections, fields, nonNeutral };
}

async function classifyWithLlm(name, text) {
  const c = await getClient();
  const stream = c.messages.stream({
    model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: buildPrompt(name, text) }],
  });
  const msg = await stream.finalMessage();
  const out = msg.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return normalizeLlm(extractJson(out));
}

// --- main loop ---------------------------------------------------------------
const out = [];
const report = [];
let i = 0;

if (!llmEnabled) {
  console.error(
    offline
      ? "ℹ️  --offline: using keyword fallback for every group (no API calls)."
      : "⚠️  ANTHROPIC_API_KEY not set — falling back to the keyword classifier for every group.\n    Set the key (or pass --offline to silence this) to use the LLM scraper.",
  );
}

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

  // Decide the classification source: LLM when enabled and we have real page
  // text; otherwise the keyword fallback. Any LLM error falls back too.
  let source = "keyword";
  let result;
  let llmError = null;
  const haveText = !fetchError && htmlToText(html).length > 200;

  if (llmEnabled && haveText) {
    try {
      result = await classifyWithLlm(name, text);
      source = "llm";
    } catch (e) {
      llmError = e.message;
    }
  }
  if (!result) {
    const c = classifyToSelfRating(text, quiz.items, quiz.filters);
    result = {
      answers: c.answers,
      filterSelections: c.filterSelections,
      fields: c.fields,
      nonNeutral: c.answers.filter((a) => a.value !== 0).length,
    };
  }

  // needsReview: failed fetch, fell back from the LLM, or very little signal.
  const needsReview = !!fetchError || source !== "llm" || result.nonNeutral < 3;
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
    language: result.fields.language,
    eventFrequency: result.fields.eventFrequency,
    groupSize: s.groupSize ?? result.fields.groupSize ?? null,
    motto: s.motto ?? null,
    foundedYear: s.foundedYear ?? null,
    logoUrl: s.logoUrl ?? null,
    // Matching data, produced directly — no legacy 17 attributes.
    selfRating: {
      raterCount: 0,
      derived: true,
      filterSelections: result.filterSelections,
      answers: result.answers,
    },
    _scrape: { fetchedUrl, source, nonNeutral: result.nonNeutral, needsReview, error: fetchError, llmError },
  });

  report.push({ ok: !fetchError, source, needsReview });
  const tag = fetchError ? `FAIL (${fetchError})` : `${source}${llmError ? ` (llm err: ${llmError})` : ""} · ${result.nonNeutral} non-neutral`;
  process.stderr.write(tag + "\n");
  if (i < seed.length) await sleep(delay);
}

writeFileSync(
  outPath,
  JSON.stringify(
    {
      _meta: {
        generatedAt: new Date().toISOString(),
        source: "scrape-llm.mjs",
        model: llmEnabled ? model : "keyword-fallback",
        count: out.length,
      },
      groups: out,
    },
    null,
    2,
  ) + "\n",
);

const failed = report.filter((r) => !r.ok).length;
const viaLlm = report.filter((r) => r.source === "llm").length;
const review = report.filter((r) => r.needsReview).length;
console.error("\n=== Scrape summary (LLM) ===");
console.error(`Groups: ${out.length} | via LLM: ${viaLlm} | keyword fallback: ${out.length - viaLlm} | fetch failed: ${failed}`);
console.error(`Needs review (failed / fallback / low signal): ${review}`);
console.error(`Wrote → ${outPath}  (selfRating produced directly; no 17-attribute layer)`);
console.error("Next: spot-check answers (see _scrape.source/error), then merge real registrations:");
console.error("  node scripts/derive-selfrating.mjs --in " + outPath + " --overrides <registration-export.json> --out data/groups.json");
console.error("  node scripts/validate-data.mjs && ./scripts/update-data.sh");
