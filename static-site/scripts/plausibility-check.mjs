// SPDX-License-Identifier: AGPL-3.0-only
//
// AI plausibility check of the VERIFIED groups: does the self-filled profile
// (category, activity filters, the 21 statements) match the group's own
// description? Writes a report for the admin team; changes NOTHING.
// Corrections go through the admin app (never edit data/groups.json by hand).
//
// Input: data/groups.json (the public export — run the "Daten-Sync" first for
// fresh data). No contact data or tokens are sent: only name, category,
// descriptions, filters and answers.
//
//   export ANTHROPIC_API_KEY=...            # or an `ant auth login` profile
//   npm run plausibility -- --dry-run       # show the prompt, no API call
//   npm run plausibility -- --direct --limit 5           # quick test, sequential
//   npm run plausibility -- --direct --slugs a,b         # specific groups
//   npm run plausibility                    # all verified groups via Batch API (50 % cheaper)
//   npm run plausibility -- --resume        # continue waiting for the last batch
//
// Output (git-ignored): plausibility-report/report.html + results.json

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  RESULT_SCHEMA,
  buildGroupMessage,
  buildSystemPrompt,
  renderReport,
  verifiedGroups,
} from "./plausibility-lib.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};

const model = getArg("--model", "claude-opus-5-5");
const effort = getArg("--effort", "high");
const outDir = getArg("--out", "plausibility-report");
const limit = Number(getArg("--limit", "0")) || 0;
const slugs = getArg("--slugs", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SITE_URL = "https://www.fomo-dresden.app";
const ADMIN_URL = "https://fomo-pi.vercel.app";

const groupsFile = JSON.parse(readFileSync(getArg("--groups", "data/groups.json"), "utf8"));
const quiz = JSON.parse(readFileSync("data/quiz.json", "utf8"));
const categories = JSON.parse(readFileSync("data/categories.json", "utf8"));

let groups = verifiedGroups(groupsFile.groups ?? groupsFile);
if (slugs.length) {
  const unknown = slugs.filter((s) => !groups.some((g) => g.slug === s));
  if (unknown.length) {
    console.error(`Unbekannte oder nicht verifizierte Slugs: ${unknown.join(", ")}`);
    process.exit(1);
  }
  groups = groups.filter((g) => slugs.includes(g.slug));
}
if (limit) groups = groups.slice(0, limit);

const system = buildSystemPrompt(quiz, categories);
const params = (g) => ({
  model,
  max_tokens: 16000,
  // Same system prompt for every group → cached after the first request.
  system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: buildGroupMessage(g, quiz) }],
  output_config: { effort, format: { type: "json_schema", schema: RESULT_SCHEMA } },
});

/** Turn one API message into a report row (or an error row). */
function toResult(g, message, error) {
  const base = { id: g.id, slug: g.slug, name: g.name };
  if (error) return { ...base, verdict: "fehler", findings: [], error };
  if (message.stop_reason === "refusal") {
    return { ...base, verdict: "fehler", findings: [], error: "Anfrage vom Modell abgelehnt (refusal)." };
  }
  if (message.stop_reason === "max_tokens") {
    return { ...base, verdict: "fehler", findings: [], error: "Antwort abgeschnitten (max_tokens)." };
  }
  const text = message.content.find((b) => b.type === "text")?.text;
  try {
    return { ...base, ...JSON.parse(text) };
  } catch {
    return { ...base, verdict: "fehler", findings: [], error: "Antwort war kein gültiges JSON." };
  }
}

function writeReport(results) {
  mkdirSync(outDir, { recursive: true });
  const createdAt = new Date().toISOString();
  writeFileSync(join(outDir, "results.json"), JSON.stringify({ model, createdAt, results }, null, 2) + "\n");
  writeFileSync(
    join(outDir, "report.html"),
    renderReport(results, { model, createdAt, siteUrl: SITE_URL, adminUrl: ADMIN_URL }),
  );
  const n = (v) => results.filter((r) => r.verdict === v).length;
  console.log(
    `\n${results.length} Gruppen: ${n("widerspruch")} Widerspruch, ${n("pruefen")} prüfen, ${n("ok")} passt, ${n("fehler")} Fehler`,
  );
  console.log(`Bericht: ${join(outDir, "report.html")}`);
}

async function getClient() {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  return new Anthropic(); // ANTHROPIC_API_KEY or an `ant auth login` profile
}

async function runDirect() {
  const client = await getClient();
  const results = [];
  for (const [i, g] of groups.entries()) {
    process.stdout.write(`[${i + 1}/${groups.length}] ${g.name} … `);
    try {
      const msg = await client.messages.create(params(g));
      const r = toResult(g, msg);
      results.push(r);
      console.log(r.verdict);
    } catch (e) {
      results.push(toResult(g, null, `API-Fehler: ${e.message}`));
      console.log("Fehler");
    }
  }
  writeReport(results);
}

const batchFile = join(outDir, "batch.json");

async function waitAndCollect(client, batchId) {
  for (;;) {
    const batch = await client.messages.batches.retrieve(batchId);
    if (batch.processing_status === "ended") break;
    const c = batch.request_counts;
    console.log(`Batch läuft: ${c.processing} offen, ${c.succeeded} fertig … (nächste Abfrage in 60 s, Abbruch mit Strg+C, weiter mit --resume)`);
    await new Promise((r) => setTimeout(r, 60_000));
  }
  const byId = new Map(groups.map((g) => [g.id, g]));
  const results = [];
  // Results arrive in any order — key by custom_id (= group id).
  for await (const item of await client.messages.batches.results(batchId)) {
    const g = byId.get(item.custom_id) ?? { id: item.custom_id, slug: "", name: item.custom_id };
    if (item.result.type === "succeeded") results.push(toResult(g, item.result.message));
    else results.push(toResult(g, null, `Batch-Ergebnis: ${item.result.type}`));
  }
  writeReport(results);
}

async function runBatch() {
  const client = await getClient();
  const batch = await client.messages.batches.create({
    requests: groups.map((g) => ({ custom_id: g.id, params: params(g) })),
  });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(batchFile, JSON.stringify({ id: batch.id, model, createdAt: new Date().toISOString() }, null, 2) + "\n");
  console.log(`Batch ${batch.id} mit ${groups.length} Gruppen gestartet.`);
  await waitAndCollect(client, batch.id);
}

async function runResume() {
  if (!existsSync(batchFile)) {
    console.error(`Kein laufender Batch gefunden (${batchFile} fehlt).`);
    process.exit(1);
  }
  const { id } = JSON.parse(readFileSync(batchFile, "utf8"));
  console.log(`Setze Batch ${id} fort.`);
  await waitAndCollect(await getClient(), id);
}

if (!groups.length) {
  console.error("Keine verifizierten Gruppen ausgewählt.");
  process.exit(1);
}

if (flag("--dry-run")) {
  console.log(`${groups.length} verifizierte Gruppen, Modell ${model}, effort ${effort}\n`);
  console.log("=== System-Prompt ===\n" + system);
  console.log(`\n=== Nachricht für „${groups[0].name}“ ===\n` + buildGroupMessage(groups[0], quiz));
} else if (flag("--resume")) {
  await runResume();
} else if (flag("--direct")) {
  await runDirect();
} else {
  await runBatch();
}
