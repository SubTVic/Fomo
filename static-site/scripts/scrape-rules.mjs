// SPDX-License-Identifier: AGPL-3.0-only
//
// Keyword rules that turn a group's page text DIRECTLY into what the static
// matcher uses: the per-item answers (-1|0|1) and the filter selections.
// The legacy 17 binary attributes are NOT produced — the static site never
// reads them. We detect "concepts" from text and map them onto the quiz items
// via quiz.json's own item.attributes mapping (isInverse / valueMap), so this
// stays generic if the item set changes (working-set-v3).
//
// Deterministic, offline, dependency-free. Output is a review-assist and is
// always overridden by a real registration. German-first keyword stems.

/** concept → keyword stems (lowercase). One hit ⇒ the concept is present. */
export const CONCEPT_KEYWORDS = {
  // --- concepts referenced by quiz items (item.attributes[].attribute) ---
  timeLow: ["unverbindlich", "wenig zeit", "gelegentlich teilnehmen", "ohne feste verpflicht", "locker dabei"],
  leadershipOpportunities: ["vorstand", "leitung", "verantwortung", "projektleit", "ressort", "organisier", "führung", "koordinier", "team leiten", "ehrenamtlicher vorstand"],
  international: ["international", "interkult", "erasmus", "englischsprachig", "intercultural", "exchange student", "foreign student", "weltweit", "globale", "welcome students"],
  handsOn: ["werkstatt", "basteln", "löten", "konstru", "prototyp", "schrauben", "selber bauen", "selbst bauen", "fertigen", "3d-druck", "hands-on", "hands on", "rennwagen", "boot bauen", "praktisch arbeiten"],
  competitive: ["wettbewerb", "meistersch", "liga", "turnier", "wettkampf", "championship", "contest", "pokal", "rennen", "antreten", "meisterschaft"],
  career: ["karriere", "beruf", "praktik", "bewerb", "recruit", "berufseinstieg", "consulting", "arbeitswelt", "unternehmensberatung", "jobmesse"],
  financialCost: ["mitgliedsbeitrag", "semesterbeitrag", "kostenpflichtig", "teilnahmegebühr", "ausrüstung anschaffen"],
  socialImpact: ["nachhaltig", "sozial", "umwelt", "klima", "ehrenamt", "gemeinnütz", "inklusion", "gesellschaft", "spenden", "wohltätig", "fairtrade", "geflüchtet", "menschenrecht", "tierschutz", "helfen"],
  religion: ["christ", "glaube", "gemeinde", "bibel", "kirche", "muslim", "islam", "jüdisch", "spirituell", "theolog", "gebet", "evangel", "katholi"],
  beginnerFriendly: ["anfänger", "einsteiger", "keine vorkenntniss", "kein vorwissen", "jeder ist willkommen", "offen für alle", "neuling", "beginner", "jeder willkommen", "ohne erfahrung", "reinschnuppern"],
  networking: ["netzwerk", "kontakte", "austausch", "community", "kennenlernen", "gemeinsam", "freundsch", "vernetz", "geselligkeit", "miteinander"],
  outdoor: ["draußen", "natur", "klettern", "wandern", "paddeln", "outdoor", "exkursion", "kanu", "alpin", "umweltbildung", "bergsport", "segeln"],
  entrepreneurship: ["gründ", "startup", "start-up", "entrepreneur", "unternehmen gründ", "geschäftsidee", "founder", "ausgründung", "innovation", "venture"],
  // --- concepts only used for filterSelections (the 8 quiz filters) ---
  arts: ["kunst", "theater", "film", "foto", "design", "kreativ", "gestalt", "bühne", "malerei", "literatur", "poesie", "tanz", "schreibwerkstatt"],
  music: ["musik", "band", "chor", "orchester", "singen", "instrument", "konzert", "gesang", "a-cappella", "big band", "jazz"],
  tech: ["software", "program", "coding", "informatik", "robotik", "elektronik", "hardware", "digital", "künstliche intelligenz", "machine learning", "esport", "gaming", "technologie", "app-entwick", "ingenieur"],
  party: ["hochschulpolitik", "gremien", "mitbestimmung", "fachschaft", "stura", "studierendenrat", "interessenvertretung", "mitwirk", "selbstverwaltung", "politische bildung"],
  sports: ["sport", "training", "mannschaft", "fitness", "athlet", "rudern", "volleyball", "fußball", "basketball", "handball", "leichtathletik", "schwimm"],
};

const ENGLISH_HINTS = ["english", "erasmus", "international", "intercultural", "exchange", "welcome students", "foreign"];
const SIZE_SMALL = ["kleine gruppe", "familiär", "überschaubar", "enger kreis", "kleines team", "klein und fein"];
const SIZE_LARGE = ["große community", "viele mitglieder", "großer verein", "hunderte mitglieder", "große gruppe"];
const FREQ_HIGH = ["wöchentlich", "jede woche", "mehrmals pro woche", "regelmäßige treffen", "jeden "];
const FREQ_LOW = ["monatlich", "gelegentlich", "unregelmäßig", "einmal im monat", "ein paar mal im jahr"];

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

const has = (t, list) => list.some((k) => t.includes(k));

/** Detect concepts (present/absent) + the three valueMap fields from text. */
export function detectConcepts(text) {
  const t = " " + text.toLowerCase() + " ";
  const concepts = {};
  let signal = 0;
  for (const [c, kws] of Object.entries(CONCEPT_KEYWORDS)) {
    const present = kws.some((kw) => t.includes(kw));
    concepts[c] = present;
    if (present) signal++;
  }
  const fields = {
    language: ENGLISH_HINTS.filter((k) => t.includes(k)).length >= 2 ? "both" : "german",
    groupSize: has(t, SIZE_SMALL) ? "small" : has(t, SIZE_LARGE) ? "large" : null,
    eventFrequency: has(t, FREQ_HIGH) ? "high" : has(t, FREQ_LOW) ? "low" : "medium",
  };
  return { concepts, fields, signal };
}

const clamp = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/**
 * Map one quiz item to a -1|0|1 answer using the detected concepts/fields and
 * the item's own attribute mapping from quiz.json.
 *  - valueMap concept: look the field's category up in the valueMap (default 0).
 *  - binary concept: present ⇒ +1, absent ⇒ 0 (unknown, NOT -1).
 *  - isInverse flips the sign (so an inverse of an absent concept stays 0).
 */
function itemValue(item, concepts, fields) {
  const parts = [];
  for (const m of item.attributes) {
    let raw;
    if (m.valueMap) {
      const cat = fields[m.attribute];
      raw = cat != null && m.valueMap[cat] != null ? m.valueMap[cat] : 0;
    } else {
      raw = concepts[m.attribute] ? 1 : 0;
    }
    if (m.isInverse) raw = -raw;
    parts.push(raw);
  }
  if (parts.length === 0) return 0;
  return clamp(Math.round(parts.reduce((a, b) => a + b, 0) / parts.length));
}

/**
 * Classify page text directly into a selfRating-shaped result for the static
 * matcher: per-item answers + the group's filter selections.
 */
export function classifyToSelfRating(text, items, filters) {
  const { concepts, fields, signal } = detectConcepts(text);
  const answers = items.map((item) => ({ itemId: item.id, value: itemValue(item, concepts, fields) }));
  const filterSelections = (filters?.options ?? [])
    .filter((o) => concepts[o.attribute])
    .map((o) => o.attribute);
  return { answers, filterSelections, fields, concepts, signal };
}
