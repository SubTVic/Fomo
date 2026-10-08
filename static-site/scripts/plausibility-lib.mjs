// SPDX-License-Identifier: AGPL-3.0-only
//
// Pure helpers for scripts/plausibility-check.mjs (no API calls, no file I/O),
// so the prompt, the result schema and the report are unit-tested
// (src/lib/__tests__/plausibility.test.ts).

/** Only verified groups are checked — their profile is the group's own view. */
export function verifiedGroups(groups) {
  return groups.filter((g) => g.selfRating && g.selfRating.derived !== true);
}

const ANSWER_LABEL = { "-1": "trifft nicht zu", 0: "neutral", 1: "trifft zu" };

/** Structured-output schema for one group's verdict. */
export const RESULT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "summary", "findings"],
  properties: {
    verdict: { type: "string", enum: ["ok", "pruefen", "widerspruch"] },
    summary: { type: "string" },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["field", "ref", "current", "suggestion", "evidence", "confidence"],
        properties: {
          field: { type: "string", enum: ["kategorie", "filter", "aussage", "beschreibung"] },
          ref: { type: "string" },
          current: { type: "string" },
          suggestion: { type: "string" },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["niedrig", "mittel", "hoch"] },
        },
      },
    },
  },
};

/**
 * System prompt: identical for every group (prompt-cached), carries the
 * category list, the filters and the 21 statements.
 */
export function buildSystemPrompt(quiz, categories) {
  const cats = categories.categories.map((c) => `- ${c.name}`).join("\n");
  const filters = quiz.filters.options.map((o) => `- ${o.attribute}: ${o.label}`).join("\n");
  const items = quiz.items.map((i) => `- ${i.id}: ${i.text}`).join("\n");
  return `Du prüfst Profile von Hochschulgruppen der TU Dresden für FOMO, ein Matching-Quiz für Erstsemester.

Jede Gruppe hat ihr Profil selbst ausgefüllt: eine Kategorie, Aktivitäts-Filter und Antworten auf 21 Aussagen (aus Sicht eines typischen Mitglieds; -1 = trifft nicht zu, 0 = neutral, 1 = trifft zu). Erstis beantworten dieselben Aussagen; je ähnlicher die Antworten, desto besser das Match. Ein Profil, das nicht zur Beschreibung passt, führt also zu falschen Empfehlungen.

Deine Aufgabe: Prüfe, ob Kategorie, Filter und Antworten zur Beschreibung der Gruppe passen.

Regeln:
- Melde nur Widersprüche, die die Beschreibung klar belegt. Zitiere dafür die Stelle wörtlich in "evidence".
- Sagt die Beschreibung zu einem Punkt nichts, ist das KEIN Befund. Die Gruppe kennt sich selbst besser als ihr Text.
- "widerspruch": mindestens ein klar belegter Widerspruch (z. B. falsche Kategorie, Filter fehlt offensichtlich, Antwort steht im Gegensatz zum Text).
- "pruefen": Auffälligkeiten ohne eindeutigen Beleg, oder die Beschreibung ist zu dünn für eine Prüfung.
- "ok": nichts Auffälliges. Dann bleibt "findings" leer.
- "ref": bei "aussage" die ID (z. B. WS2-07), bei "filter" den Filternamen (z. B. sports), bei "kategorie" den Kategorienamen.
- "current" ist der aktuelle Wert, "suggestion" dein Vorschlag aus den erlaubten Werten.
- "summary": ein bis zwei Sätze auf Deutsch für das Admin-Team.

Erlaubte Kategorien:
${cats}

Filter (Mehrfachauswahl; ausgewählt = die Gruppe bietet das an):
${filters}

Aussagen:
${items}`;
}

/** User message with one group's profile. */
export function buildGroupMessage(group, quiz) {
  const filterLabel = new Map(quiz.filters.options.map((o) => [o.attribute, o.label]));
  const answers = new Map(group.selfRating.answers.map((a) => [a.itemId, a.value]));
  const selected = group.selfRating.filterSelections ?? [];
  const lines = quiz.items.map((i) => {
    const v = answers.get(i.id);
    return `- ${i.id}: ${v === undefined ? "keine Antwort" : `${v > 0 ? "+1" : v} (${ANSWER_LABEL[v]})`}`;
  });
  return `Gruppe: ${group.name}
Kategorie: ${group.categoryName}
Gewählte Filter: ${selected.length ? selected.map((f) => `${f} (${filterLabel.get(f) ?? "?"})`).join(", ") : "keine"}

Kurzbeschreibung:
${group.shortDescription ?? ""}

Beschreibung:
${group.longDescription ?? "(keine)"}

Antworten:
${lines.join("\n")}`;
}

const ORDER = { widerspruch: 0, pruefen: 1, fehler: 2, ok: 3 };

/** Sort results: contradictions first, then by group name. */
export function sortResults(results) {
  return [...results].sort(
    (a, b) => ORDER[a.verdict] - ORDER[b.verdict] || a.name.localeCompare(b.name, "de"),
  );
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const VERDICT_LABEL = {
  widerspruch: "Widerspruch",
  pruefen: "Prüfen",
  ok: "Passt",
  fehler: "Fehler (nicht geprüft)",
};

/**
 * Self-contained HTML report. results: [{ id, slug, name, verdict, summary,
 * findings, error? }]. Links go to the public profile and the admin app.
 */
export function renderReport(results, { model, createdAt, siteUrl, adminUrl }) {
  const sorted = sortResults(results);
  const count = (v) => results.filter((r) => r.verdict === v).length;
  const rows = sorted
    .map((r) => {
      const findings = (r.findings ?? [])
        .map(
          (f) => `<tr><td>${esc(f.field)}</td><td>${esc(f.ref)}</td><td>${esc(f.current)}</td><td>${esc(f.suggestion)}</td><td>„${esc(f.evidence)}“</td><td>${esc(f.confidence)}</td></tr>`,
        )
        .join("");
      return `<section class="g ${esc(r.verdict)}">
  <h2>${esc(r.name)} <span class="badge">${esc(VERDICT_LABEL[r.verdict] ?? r.verdict)}</span></h2>
  <p class="links"><a href="${esc(`${siteUrl}/groups/${r.slug}/`)}">Öffentliches Profil</a> · <a href="${esc(`${adminUrl}/admin/groups/${r.id}`)}">In der Admin-App bearbeiten</a></p>
  <p>${esc(r.error ?? r.summary)}</p>
  ${findings ? `<table><thead><tr><th>Feld</th><th>Bezug</th><th>Aktuell</th><th>Vorschlag</th><th>Beleg</th><th>Sicherheit</th></tr></thead><tbody>${findings}</tbody></table>` : ""}
</section>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>FOMO Plausibilitätsprüfung</title>
<style>
body{font-family:system-ui,sans-serif;background:#ADD8E6;color:#1a2a35;margin:0;padding:16px}
main{max-width:1000px;margin:0 auto}
h1{text-transform:uppercase}
.g{background:#fff;border:4px solid #1a2a35;padding:12px 16px;margin:12px 0}
.g h2{font-size:1.1rem;margin:0 0 4px}
.badge{font-size:.75rem;padding:2px 8px;border:2px solid #1a2a35;margin-left:6px;white-space:nowrap}
.widerspruch .badge{background:#1a2a35;color:#fff}.pruefen .badge{background:#ffe08a}.fehler .badge{background:#f4b4b4}
.links{font-size:.85rem}
table{border-collapse:collapse;width:100%;font-size:.85rem;display:block;overflow-x:auto}
th,td{border:1px solid #c5d5dc;padding:4px 6px;text-align:left;vertical-align:top}
</style></head><body><main>
<h1>Plausibilitätsprüfung</h1>
<p>${results.length} verifizierte Gruppen · ${count("widerspruch")} Widerspruch · ${count("pruefen")} prüfen · ${count("ok")} passt${count("fehler") ? ` · ${count("fehler")} Fehler` : ""}<br>
Modell ${esc(model)}, erstellt ${esc(createdAt)}. Die KI macht nur Vorschläge – Änderungen bitte über die Admin-App, nie in groups.json.</p>
${rows}
</main></body></html>
`;
}
