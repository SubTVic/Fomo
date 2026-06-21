// SPDX-License-Identifier: AGPL-3.0-only
//
// Keyword rules that turn a group's page text into the 17 binary attributes
// (+ language / eventFrequency) the matching pipeline expects. Deliberately
// deterministic and offline — no LLM, no dependency. Output is a *suggestion*
// that must be reviewed; it feeds the same scraped-groups.json schema and is
// always overridden by a real registration.
//
// German-first keyword stems, lowercased substring match. Lists are tuned
// against the 36 verified groups (see scripts: npm run scrape:eval).

/** attribute → keyword stems (lowercase). A single hit sets the attribute true. */
export const ATTRIBUTE_KEYWORDS = {
  career: ["karriere", "beruf", "praktik", "bewerb", "recruit", "berufseinstieg", "consulting", "arbeitswelt", "unternehmensberatung", "jobmesse"],
  tech: ["software", "program", "coding", "informatik", "robotik", "elektronik", "hardware", "digital", "künstliche intelligenz", "machine learning", "esport", "gaming", "technologie", "app-entwick", "ingenieur"],
  socialImpact: ["nachhaltig", "sozial", "umwelt", "klima", "ehrenamt", "gemeinnütz", "inklusion", "gesellschaft", "spenden", "wohltätig", "fairtrade", "geflüchtet", "menschenrecht", "tierschutz"],
  party: ["hochschulpolitik", "gremien", "mitbestimmung", "fachschaft", "stura", "studierendenrat", "interessenvertretung", "mitwirk", "hochschulgruppenpolitik", "selbstverwaltung"],
  religion: ["christ", "glaube", "gemeinde", "bibel", "kirche", "muslim", "islam", "jüdisch", "spirituell", "theolog", "gebet", "evangel", "katholi"],
  sports: ["sport", "training", "mannschaft", "fitness", "athlet", "rudern", "volleyball", "fußball", "basketball", "handball", "leichtathletik", "schwimm"],
  networking: ["netzwerk", "kontakte", "austausch", "community", "kennenlernen", "gemeinsam", "freundsch", "vernetz", "geselligkeit", "miteinander"],
  arts: ["kunst", "theater", "film", "foto", "design", "kreativ", "gestalt", "bühne", "malerei", "literatur", "poesie", "tanz", "schreibwerkstatt"],
  music: ["musik", "band", "chor", "orchester", "singen", "instrument", "konzert", "gesang", "a-cappella", "big band", "jazz"],
  handsOn: ["werkstatt", "basteln", "löten", "konstru", "prototyp", "schrauben", "selber bauen", "fertigen", "3d-druck", "hands-on", "hands on", "praktisch arbeiten", "rennwagen", "boot"],
  outdoor: ["draußen", "natur", "klettern", "wandern", "paddeln", "outdoor", "exkursion", "kanu", "alpin", "umweltbildung", "bergsport"],
  international: ["international", "interkult", "erasmus", "englischsprachig", "intercultural", "exchange student", "foreign student", "weltweit", "globale", "welcome"],
  beginnerFriendly: ["anfänger", "einsteiger", "keine vorkenntniss", "kein vorwissen", "jeder ist willkommen", "offen für alle", "neuling", "beginner", "jeder willkommen", "ohne erfahrung"],
  competitive: ["wettbewerb", "meistersch", "liga", "turnier", "wettkampf", "championship", "contest", "pokal", "rennen", "antreten"],
  leadershipOpportunities: ["vorstand", "leitung", "verantwortung", "projektleit", "ressort", "organisier", "führung", "koordinier", "team leiten"],
  // Low-signal from public text — kept conservative (rarely fire), review needed.
  timeLow: ["unverbindlich", "wenig zeit", "gelegentlich teilnehmen", "ohne feste verpflicht", "locker dabei"],
  financialCost: ["mitgliedsbeitrag", "semesterbeitrag", "kostenpflichtig", "teilnahmegebühr", "ausrüstung anschaffen"],
};

const ENGLISH_HINTS = ["english", "erasmus", "international", "intercultural", "exchange", "welcome", "foreign"];
const FREQ_HIGH = ["wöchentlich", "jede woche", "jeden ", "regelmäßig", "wochentlich"];
const FREQ_LOW = ["monatlich", "gelegentlich", "unregelmäßig", "ein paar mal im jahr"];

export const ATTRIBUTE_KEYS = Object.keys(ATTRIBUTE_KEYWORDS);

/** Strip HTML to plain, lowercased text (dependency-free, good enough for keywords). */
export function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Classify page text → attributes + fields, with per-attribute hit counts and a
 * total signal count (low signal ⇒ flag for review).
 */
export function classify(text) {
  const t = " " + text.toLowerCase() + " ";
  const hits = {};
  const attributes = {};
  let signal = 0;
  for (const [attr, kws] of Object.entries(ATTRIBUTE_KEYWORDS)) {
    const n = kws.reduce((c, kw) => c + (t.includes(kw) ? 1 : 0), 0);
    hits[attr] = n;
    attributes[attr] = n > 0;
    signal += n;
  }
  const englishHits = ENGLISH_HINTS.reduce((c, kw) => c + (t.includes(kw) ? 1 : 0), 0);
  const language = englishHits >= 2 ? "both" : "german";
  const eventFrequency = FREQ_HIGH.some((k) => t.includes(k))
    ? "high"
    : FREQ_LOW.some((k) => t.includes(k))
      ? "low"
      : "medium";

  return { attributes, language, eventFrequency, hits, signal };
}
