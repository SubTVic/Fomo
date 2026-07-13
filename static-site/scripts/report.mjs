// SPDX-License-Identifier: AGPL-3.0-only
//
// FOMO report generator: pulls the anonymous quiz analytics from the Umami API,
// joins them with quiz.json (question texts) and groups.json (group names), and
// writes a single self-contained HTML report with charts — readable answers per
// question, filter choices, drop-off funnel, which groups the quiz recommends,
// and a bias analysis (empirical + simulated against the real matching code).
//
//   node scripts/report.mjs [--out fomo-report.html] [--days 90] [--sim 20000]
//                           [--offline]
//
// Auth (either one):
//   Umami Cloud:  UMAMI_API_KEY=...            (base https://api.umami.is/v1)
//   Self-hosted:  UMAMI_URL=https://stats.example.de UMAMI_USER=... UMAMI_PASSWORD=...
// Both need:      UMAMI_WEBSITE_ID=<uuid>
//
// --offline skips the API entirely: the report then contains only the
// simulation-based bias section (needs no traffic, only groups.json).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const OUT = getArg("--out", "fomo-report.html");
const DAYS = parseInt(getArg("--days", "90"), 10);
const SIM_N = parseInt(getArg("--sim", "20000"), 10);
const OFFLINE = args.includes("--offline");

const quiz = JSON.parse(readFileSync(join(ROOT, "data/quiz.json"), "utf8"));
const groupsAll = JSON.parse(readFileSync(join(ROOT, "data/groups.json"), "utf8")).groups;
// Matching runs against verified groups only — mirror src/lib/data.ts.
const groups = groupsAll.filter((g) => g.selfRating.derived !== true);
const groupName = new Map(groupsAll.map((g) => [g.slug, g.name]));
const filterLabel = new Map(quiz.filters.options.map((o) => [o.attribute, o.label]));

// ---------------------------------------------------------------------------
// Matching replica — KEEP IN SYNC with src/lib/matching.ts (scoreGroup).
// Small on purpose so drift is easy to spot in review.
// ---------------------------------------------------------------------------
function scoreGroup(userAnswers, userFilters, group) {
  const groupFilters = group.selfRating.filterSelections ?? [];
  if (userFilters.length > 0 && groupFilters.length > 0) {
    if (!userFilters.some((f) => groupFilters.includes(f))) return 0;
  }
  const map = {};
  for (const a of group.selfRating.answers) map[a.itemId] = a.value;
  const active = Object.entries(userAnswers).filter(([, v]) => v !== 0);
  if (active.length === 0) return 50;
  const totalDist = active.reduce((s, [id, u]) => s + Math.abs(u - (map[id] ?? 0)), 0);
  return Math.round((1 - totalDist / (active.length * 2)) * 100);
}
/** Full positive-score ranking, same order as the site. */
function rankAll(userAnswers, userFilters) {
  return groups
    .map((g) => ({ g, score: scoreGroup(userAnswers, userFilters, g) }))
    .filter((m) => m.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.g.selfRating.raterCount ?? 0) - (a.g.selfRating.raterCount ?? 0) ||
        a.g.name.localeCompare(b.g.name, "de"),
    );
}

function topFive(userAnswers, userFilters) {
  // KEEP IN SYNC with topWithTies in src/lib/matching.ts: the first 5 plus all
  // boundary ties (cap 10) — the same set the results screen shows and the
  // quiz-result-group event records.
  const positive = rankAll(userAnswers, userFilters);
  if (positive.length <= 5) return positive;
  let end = 5;
  while (end < positive.length && end < 10 && positive[end].score === positive[4].score) end++;
  return positive.slice(0, end);
}

/** Decode the compact ?r= result string (see src/lib/results.ts). */
function decodeR(r) {
  const [a, f = ""] = String(r).split("-");
  if (!a || a.length !== quiz.items.length || !/^[012]+$/.test(a)) return null;
  const answers = {};
  quiz.items.forEach((it, i) => (answers[it.id] = Number(a[i]) - 1));
  const filters = quiz.filters.options.filter((o, i) => f[i] === "1").map((o) => o.attribute);
  return { answers, filters };
}

// ---------------------------------------------------------------------------
// Umami API (Cloud key or self-hosted login), graceful when absent.
// ---------------------------------------------------------------------------
const WEBSITE = process.env.UMAMI_WEBSITE_ID;
const CLOUD_KEY = process.env.UMAMI_API_KEY;
const SELF_URL = process.env.UMAMI_URL?.replace(/\/$/, "");
const endAt = Date.now();
const startAt = endAt - DAYS * 86400_000;
let apiBase = null;
let authHeader = null;

async function apiLogin() {
  if (OFFLINE) return false;
  if (!WEBSITE) return false;
  if (CLOUD_KEY) {
    apiBase = "https://api.umami.is/v1";
    authHeader = { "x-umami-api-key": CLOUD_KEY };
    return true;
  }
  if (SELF_URL && process.env.UMAMI_USER && process.env.UMAMI_PASSWORD) {
    const r = await fetch(`${SELF_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: process.env.UMAMI_USER,
        password: process.env.UMAMI_PASSWORD,
      }),
    });
    if (!r.ok) throw new Error(`Umami login failed: HTTP ${r.status}`);
    const { token } = await r.json();
    apiBase = `${SELF_URL}/api`;
    authHeader = { Authorization: `Bearer ${token}` };
    return true;
  }
  return false;
}

async function api(path, params = {}) {
  const qs = new URLSearchParams({ startAt: String(startAt), endAt: String(endAt), ...params });
  const r = await fetch(`${apiBase}/websites/${WEBSITE}${path}?${qs}`, { headers: authHeader });
  if (!r.ok) throw new Error(`GET ${path} → HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
/** value→count map for one event property. */
async function values(eventName, propertyName) {
  let rows = await api("/event-data/values", { eventName, propertyName });
  // Param name differs between Umami versions/deployments — retry with
  // `event` when `eventName` yields nothing.
  if (!Array.isArray(rows) || rows.length === 0) {
    try {
      rows = await api("/event-data/values", { event: eventName, propertyName });
    } catch {
      rows = [];
    }
  }
  const m = new Map();
  for (const row of rows ?? []) {
    // Umami returns NUMBER-typed event data as decimal strings ("1.0000");
    // canonicalise numeric-looking values so lookups like "1"/"0"/"-1" match.
    let key = String(row.value);
    if (/^-?\d+(\.\d+)?$/.test(key)) key = String(parseFloat(key));
    m.set(key, (m.get(key) ?? 0) + Number(row.total));
  }
  return m;
}

async function fetchAll() {
  const data = { live: false };
  if (!(await apiLogin())) {
    console.error(
      OFFLINE
        ? "ℹ️  --offline: Bericht enthält nur die Simulations-/Bias-Sektion."
        : "⚠️  Keine Umami-Zugangsdaten (UMAMI_WEBSITE_ID + UMAMI_API_KEY oder UMAMI_URL/USER/PASSWORD).\n    Bericht enthält nur die Simulations-/Bias-Sektion.",
    );
    return data;
  }
  console.error(`→ Umami-API: ${apiBase} (letzte ${DAYS} Tage)`);
  data.live = true;
  data.stats = await api("/stats");
  const metrics = await api("/metrics", { type: "event", limit: "500" });
  data.events = new Map(metrics.map((m) => [m.x, Number(m.y)]));
  // Which event-data fields the server actually stored (name + data type) —
  // pure diagnostics, shown in the report so aggregation problems (e.g.
  // number-typed fields that the values API cannot enumerate) are visible.
  try {
    data.fields = await api("/event-data/fields");
  } catch {
    data.fields = null;
  }
  data.perItem = {};
  for (const item of quiz.items) data.perItem[item.id] = await values("quiz-response", item.id);
  data.respFilters = await values("quiz-response", "filters");
  data.itemViews = await values("quiz-item-view", "index");
  data.resultGroups = await values("quiz-result-group", "group");
  data.resultRanks = await values("quiz-result-group", "rank");
  data.feedback = await values("results-feedback", "value");
  data.clicksByGroup = await values("group-click", "group");
  data.clickContexts = await values("group-click", "context");
  data.clickDests = await values("group-click", "dest");
  data.selfRecRanks = await values("self-recognition", "rank");
  data.selfRecGroups = await values("self-recognition", "group");
  // Self-contained "pick" payloads (slug|rank|answers) — the revealed-
  // preference data for the clicked-vs-ranked analysis.
  data.picks = new Map();
  for (const ev of ["group-click", "group-detail-open"]) {
    for (const [k, n] of await values(ev, "pick")) data.picks.set(k, (data.picks.get(k) ?? 0) + n);
  }
  return data;
}

// ---------------------------------------------------------------------------
// Bias simulation against the real matcher.
// ---------------------------------------------------------------------------
// Deterministic PRNG (mulberry32, fixed seed): the structural simulation must
// produce IDENTICAL numbers on every run so reports are comparable over time.
// It deliberately does NOT use live answer distributions — the section measures
// what the algorithm + group profiles bake in, independent of who takes the
// quiz (that behaviour-independence is also what makes the "echt vs. erwartet"
// scatter's diagonal meaningful). Results change only when groups.json or
// quiz.json change — which is exactly the signal we want.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSampler() {
  const rng = mulberry32(20260711); // fixed seed — same run, same numbers
  const fAttrs = quiz.filters.options.map((o) => o.attribute);
  return {
    answers() {
      const a = {};
      for (const item of quiz.items) {
        const r = rng();
        a[item.id] = r < 1 / 3 ? -1 : r < 2 / 3 ? 0 : 1;
      }
      return a;
    },
    filters() {
      // Fixed model: half the profiles filter-free; the rest pick 1–3 filters
      // uniformly. Intentionally NOT fitted to live behaviour (see above).
      if (rng() < 0.5) return [];
      const n = rng() < 0.6 ? 1 : rng() < 0.85 ? 2 : 3;
      const picked = new Set();
      while (picked.size < n) picked.add(fAttrs[Math.floor(rng() * fAttrs.length)]);
      return [...picked];
    },
  };
}

function simulate() {
  const sampler = buildSampler();
  const stat = new Map(
    groups.map((g) => [g.slug, { top5: 0, wins: 0, rankSum: 0 }]),
  );
  for (let i = 0; i < SIM_N; i++) {
    const top = topFive(sampler.answers(), sampler.filters());
    top.forEach((m, r) => {
      const s = stat.get(m.g.slug);
      s.top5++;
      s.rankSum += r + 1;
      if (r === 0) s.wins++;
    });
  }
  return {
    n: SIM_N,
    perGroup: [...stat.entries()]
      .map(([slug, s]) => ({
        slug,
        name: groupName.get(slug) ?? slug,
        rate: s.top5 / SIM_N,
        winRate: s.wins / SIM_N,
        avgRank: s.top5 ? s.rankSum / s.top5 : null,
        neutralAnswers: countNeutral(slug),
        filterCount: (groups.find((g) => g.slug === slug)?.selfRating.filterSelections ?? []).length,
      }))
      .sort((a, b) => b.rate - a.rate),
  };
}
function countNeutral(slug) {
  const g = groups.find((x) => x.slug === slug);
  return g ? g.selfRating.answers.filter((a) => a.value === 0).length : 0;
}

// ---------------------------------------------------------------------------
// SVG chart builders (validated palette; specs per dataviz method).
// ---------------------------------------------------------------------------
const C = {
  agree: "#2a78d6", // diverging cool pole (validated)
  disagree: "#e34948", // diverging warm pole (validated)
  neutral: "#f0efec", // diverging midpoint (reads as "nothing")
  series: "#2a78d6", // single nominal series
  ink: "#1a2a35",
  ink2: "#52514e",
  muted: "#898781",
  grid: "#e1e0d9",
  surface: "#ffffff",
};
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trunc = (s, n = 42) => (String(s).length > n ? String(s).slice(0, n - 1) + "…" : String(s));
const pct = (x, d = 0) => `${(x * 100).toFixed(d)} %`;

/** Horizontal diverging stacked bars (Likert). rows: {label, tip, neg, mid, pos} shares. */
function likertChart(rows) {
  const labelW = 380;
  const barW = 460;
  const rowH = 26;
  const gap = 8;
  const H = rows.length * (rowH + gap) + 30;
  let s = `<svg viewBox="0 0 ${labelW + barW + 60} ${H}" role="img" style="width:100%;height:auto">`;
  rows.forEach((r, i) => {
    const y = 24 + i * (rowH + gap);
    const segs = [
      { v: r.neg, c: C.disagree, dark: true },
      { v: r.mid, c: C.neutral, dark: false },
      { v: r.pos, c: C.agree, dark: true },
    ];
    let x = labelW;
    s += `<text x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="12" fill="${C.ink2}">${esc(trunc(r.label, 52))}</text>`;
    for (const seg of segs) {
      const w = Math.max(0, seg.v * barW - 2); // 2px surface gap between segments
      if (seg.v > 0)
        s += `<rect x="${x}" y="${y}" width="${w}" height="${rowH}" rx="3" fill="${seg.c}" data-tip="${esc(r.tip)}&#10;Ablehnung ${pct(r.neg)} · Neutral ${pct(r.mid)} · Zustimmung ${pct(r.pos)}"/>`;
      if (seg.v >= 0.12)
        s += `<text x="${x + (seg.v * barW) / 2}" y="${y + rowH / 2 + 4}" text-anchor="middle" font-size="11" fill="${seg.dark ? "#fff" : C.ink2}" pointer-events="none">${pct(seg.v)}</text>`;
      x += seg.v * barW;
    }
  });
  s += `</svg>`;
  return s;
}

/** Horizontal single-series bars. rows: {label, value, tip?, extra?}; fmt(value). */
function hbarChart(rows, fmt = (v) => String(v)) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const labelW = 320;
  const barW = 420;
  const rowH = 22;
  const gap = 8;
  const H = rows.length * (rowH + gap) + 10;
  let s = `<svg viewBox="0 0 ${labelW + barW + 180} ${H}" role="img" style="width:100%;height:auto">`;
  rows.forEach((r, i) => {
    const y = 4 + i * (rowH + gap);
    const w = Math.max(2, (r.value / max) * barW);
    s += `<text x="${labelW - 10}" y="${y + rowH / 2 + 4}" text-anchor="end" font-size="12" fill="${C.ink2}">${esc(trunc(r.label))}</text>`;
    s += `<rect x="${labelW}" y="${y}" width="${w}" height="${rowH}" rx="3" fill="${C.series}" data-tip="${esc(r.tip ?? r.label)}: ${esc(fmt(r.value))}${r.extra ? " · " + esc(r.extra) : ""}"/>`;
    s += `<text x="${labelW + w + 8}" y="${y + rowH / 2 + 4}" font-size="12" fill="${C.ink}">${esc(fmt(r.value))}${r.extra ? ` <tspan fill="${C.muted}">· ${esc(r.extra)}</tspan>` : ""}</text>`;
  });
  s += `</svg>`;
  return s;
}

/** Funnel: columns per question index with retention line labels. */
function funnelChart(counts) {
  const n = counts.length;
  if (!n) return "";
  const max = Math.max(...counts.map((c) => c.count), 1);
  const W = 900;
  const H = 240;
  const pad = { l: 46, r: 10, t: 24, b: 46 };
  const bw = (W - pad.l - pad.r) / n - 4;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" style="width:100%;height:auto">`;
  for (const gy of [0.25, 0.5, 0.75, 1]) {
    const y = pad.t + (1 - gy) * (H - pad.t - pad.b);
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="${C.grid}"/>`;
    s += `<text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" font-size="10" fill="${C.muted}">${Math.round(max * gy)}</text>`;
  }
  counts.forEach((c, i) => {
    const h = (c.count / max) * (H - pad.t - pad.b);
    const x = pad.l + i * ((W - pad.l - pad.r) / n) + 2;
    const y = H - pad.b - h;
    s += `<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${C.series}" data-tip="Frage ${i + 1}: ${esc(c.title)}&#10;${c.count} Ansichten (${pct(c.count / max)} Verbleib)"/>`;
    s += `<text x="${x + bw / 2}" y="${H - pad.b + 14}" text-anchor="middle" font-size="9" fill="${C.muted}">${i + 1}</text>`;
  });
  s += `<text x="${pad.l}" y="${H - 8}" font-size="11" fill="${C.ink2}">Frage-Nr. — Balkenhöhe = wie viele die Frage noch gesehen haben (Drop-off = Treppenabfall)</text>`;
  s += `</svg>`;
  return s;
}

/** Scatter empirical vs simulated top-5 rate, y=x reference. */
function biasScatter(points) {
  const W = 560;
  const H = 480;
  const pad = { l: 60, r: 16, t: 16, b: 48 };
  const max = Math.min(1, Math.max(...points.flatMap((p) => [p.x, p.y]), 0.05) * 1.1);
  const sx = (v) => pad.l + (v / max) * (W - pad.l - pad.r);
  const sy = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" style="width:100%;height:auto;max-width:${W}px">`;
  for (const g of [0.25, 0.5, 0.75, 1]) {
    const v = max * g;
    s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${pad.t}" y2="${H - pad.b}" stroke="${C.grid}"/>`;
    s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${sy(v)}" y2="${sy(v)}" stroke="${C.grid}"/>`;
    s += `<text x="${sx(v)}" y="${H - pad.b + 16}" text-anchor="middle" font-size="10" fill="${C.muted}">${pct(v)}</text>`;
    s += `<text x="${pad.l - 8}" y="${sy(v) + 4}" text-anchor="end" font-size="10" fill="${C.muted}">${pct(v)}</text>`;
  }
  s += `<line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(max)}" y2="${sy(max)}" stroke="${C.muted}" stroke-dasharray="5 4"/>`;
  // label the strongest deviations only (selective direct labels)
  const labeled = [...points].sort((a, b) => Math.abs(b.y - b.x) - Math.abs(a.y - a.x)).slice(0, 6);
  for (const p of points) {
    s += `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="5" fill="${C.series}" stroke="#fff" stroke-width="2" data-tip="${esc(p.label)}&#10;simuliert ${pct(p.x, 1)} · echt ${pct(p.y, 1)}"/>`;
  }
  for (const p of labeled) {
    s += `<text x="${sx(p.x) + 8}" y="${sy(p.y) - 6}" font-size="10" fill="${C.ink2}">${esc(p.label.slice(0, 28))}</text>`;
  }
  s += `<text x="${(W + pad.l - pad.r) / 2}" y="${H - 6}" text-anchor="middle" font-size="11" fill="${C.ink2}">strukturell erwartete Top-5-Rate (Simulation)</text>`;
  s += `<text transform="rotate(-90)" x="${-(H - pad.b + pad.t) / 2}" y="14" text-anchor="middle" font-size="11" fill="${C.ink2}">echte Top-5-Rate</text>`;
  s += `</svg>`;
  return s;
}

function table(head, rows) {
  return `<details class="tbl"><summary>Daten als Tabelle</summary><table><thead><tr>${head
    .map((h) => `<th>${esc(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></details>`;
}

// ---------------------------------------------------------------------------
// Report assembly
// ---------------------------------------------------------------------------
function buildHtml(data, sim) {
  const now = new Date().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const completions = data.events?.get("quiz-complete") ?? 0;
  const starts = data.events?.get("quiz-start") ?? 0;
  const sections = [];

  const noData = `<p class="nodata">Keine Live-Daten — Umami-Zugang fehlt oder es gibt noch keine Events im Zeitraum.</p>`;

  // --- 1 Kernzahlen -----------------------------------------------------
  if (data.live) {
    const up = data.feedback?.get("up") ?? 0;
    const down = data.feedback?.get("down") ?? 0;
    // Stats shape differs between Umami versions: {visitors:{value}} or plain
    // numbers — accept both.
    const stat = (x) => x?.value ?? (typeof x === "number" ? x : "–");
    const tiles = [
      ["Besucher:innen", stat(data.stats?.visitors)],
      ["Seitenaufrufe", stat(data.stats?.pageviews)],
      ["Quiz-Starts", starts],
      ["Quiz-Abschlüsse", completions],
      ["Abschlussquote", starts ? pct(completions / starts) : "–"],
      ["Feedback 👍", up + down ? pct(up / (up + down)) : "–"],
    ];
    // Diagnostic line: which events actually arrived in the window. Makes
    // "section is empty because the event only ships since <date>" vs.
    // "events arrive but a lookup is broken" distinguishable at a glance.
    const evLine = [...(data.events ?? new Map()).entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([n, c]) => `${esc(n)}&thinsp;×&thinsp;${c}`)
      .join(" · ");
    // Field diagnostics: property name + stored data type. A number-typed
    // field cannot be enumerated by the values API — if answer charts are
    // empty, this line shows why.
    const fieldLine = Array.isArray(data.fields)
      ? data.fields
          .slice(0, 30)
          .map((f) => `${esc(f.propertyName ?? f.fieldName ?? "?")}&thinsp;(${esc(String(f.dataType ?? f.type ?? "?"))})`)
          .join(" · ")
      : null;
    sections.push(
      `<section><h2>Kernzahlen</h2><div class="tiles">${tiles
        .map(([l, v]) => `<div class="tile"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`)
        .join("")}</div>
      <p class="sub" style="margin-top:12px">Events im Zeitraum: ${evLine || "keine"}</p>
      ${fieldLine ? `<p class="sub">Gespeicherte Datenfelder (Typ): ${fieldLine}</p>` : ""}</section>`,
    );
  }

  // --- 2 Antworten pro Frage --------------------------------------------
  {
    let body = noData;
    let tbl = "";
    const answerTotal = data.perItem
      ? quiz.items.reduce(
          (s, item) => s + [...(data.perItem[item.id] ?? new Map()).values()].reduce((a, b) => a + b, 0),
          0,
        )
      : 0;
    if (data.live && answerTotal === 0) {
      body = `<p class="nodata">Noch keine auswertbaren Antwort-Daten. Antworten, die vor dem
        11.07.2026 eingingen, wurden als Zahlen gespeichert — dieses Format kann die Umami-API
        nicht zu Verteilungen auszählen. Seit dem Update werden sie auszählbar (als Text)
        gesendet: <strong>jeder neue Quiz-Abschluss füllt diese Sektion</strong>. Diagnose:
        Zeilen „Events im Zeitraum" und „Gespeicherte Datenfelder" oben.</p>`;
    }
    if (data.live && completions > 0 && answerTotal > 0) {
      const rows = quiz.items.map((item) => {
        const m = data.perItem[item.id] ?? new Map();
        const neg = m.get("-1") ?? 0;
        const mid = m.get("0") ?? 0;
        const pos = m.get("1") ?? 0;
        const t = Math.max(neg + mid + pos, 1);
        return {
          label: item.shortTitle ?? item.id,
          tip: item.text,
          neg: neg / t,
          mid: mid / t,
          pos: pos / t,
          raw: [item.text, pos, mid, neg],
        };
      });
      body =
        `<div class="legend"><span><i style="background:${C.agree}"></i>Zustimmung</span>` +
        `<span><i style="background:${C.neutral};border:1px solid ${C.grid}"></i>Neutral</span>` +
        `<span><i style="background:${C.disagree}"></i>Ablehnung</span></div>` +
        likertChart(rows);
      tbl = table(
        ["Frage", "Zustimmung", "Neutral", "Ablehnung"],
        rows.map((r) => r.raw),
      );
      // Item diagnosis: flag weak questions automatically. High neutral share
      // = the item doesn't trigger an opinion; high dominance = everyone
      // answers the same → no discrimination. Both are v3 removal candidates.
      const diag = rows
        .map((r) => ({
          label: r.label,
          neutral: r.mid,
          dominance: Math.max(r.neg, r.mid, r.pos),
          flag: r.mid >= 0.5 ? "⚠ hohe Neutral-Quote" : Math.max(r.neg, r.pos) >= 0.75 ? "⚠ sehr einseitig" : "",
        }))
        .sort((a, b) => b.neutral - a.neutral);
      const flagged = diag.filter((d) => d.flag).length;
      tbl += `<details class="tbl"><summary>Item-Diagnose — Streichkandidaten für Working-Set v3 (${flagged} markiert)</summary>
        <table><thead><tr><th>Frage</th><th>Neutral-Quote</th><th>stärkste Antwort</th><th>Befund</th></tr></thead><tbody>${diag
          .map((d) => `<tr><td>${esc(d.label)}</td><td>${pct(d.neutral)}</td><td>${pct(d.dominance)}</td><td>${esc(d.flag)}</td></tr>`)
          .join("")}</tbody></table>
        <p class="sub" style="margin-top:8px">Faustregeln: Neutral ≥ 50 % = Frage erzeugt keine Meinung; eine Seite ≥ 75 % = Frage trennt nicht. Bei kleinem n nur Hinweise.</p></details>`;
    }
    sections.push(
      `<section><h2>Welche Wahl treffen die Studierenden?</h2>
       <p class="sub">Antwortverteilung pro Frage (Kurztitel links, kompletter Fragetext im Tooltip). Auffällig einseitige Fragen trennen schlecht — Kandidaten fürs nächste Frageset.</p>
       ${body}${tbl}</section>`,
    );
  }

  // --- 3 Filterwahl -------------------------------------------------------
  if (data.live && data.respFilters?.size) {
    const counts = new Map();
    let none = 0;
    let total = 0;
    for (const [v, n] of data.respFilters) {
      total += n;
      if (v === "none") none += n;
      else for (const f of v.split(",")) counts.set(f, (counts.get(f) ?? 0) + n);
    }
    const rows = [...counts.entries()]
      .map(([f, n]) => ({ label: filterLabel.get(f) ?? f, value: n }))
      .sort((a, b) => b.value - a.value);
    rows.push({ label: "— ohne Filter gestartet —", value: none });
    sections.push(
      `<section><h2>Filterwahl</h2>
       <p class="sub">Welche Aktivitäts-Filter beim Quiz gewählt wurden (${total} Abschlüsse).</p>
       ${hbarChart(rows)}${table(["Filter", "Anzahl"], rows.map((r) => [r.label, r.value]))}</section>`,
    );
  }

  // --- 4 Durchlauf & Abbrüche ---------------------------------------------
  if (data.live && data.itemViews?.size) {
    const counts = quiz.items.map((item, i) => ({
      title: item.shortTitle ?? item.id,
      count: data.itemViews.get(String(i)) ?? 0,
    }));
    const first = counts[0]?.count ?? 0;
    const last = counts[counts.length - 1]?.count ?? 0;
    sections.push(
      `<section><h2>Durchlauf &amp; Abbrüche</h2>
       <p class="sub">Wie viele Teilnehmende jede Frage noch gesehen haben. Verbleib von Frage 1 zu Frage ${counts.length}: <strong>${first ? pct(last / first) : "–"}</strong>.</p>
       ${funnelChart(counts)}${table(["#", "Frage", "Ansichten"], counts.map((c, i) => [i + 1, c.title, c.count]))}</section>`,
    );
  }

  // --- 5 Top-Gruppen in den Ergebnissen ------------------------------------
  if (data.live && data.resultGroups?.size) {
    const rows = [...data.resultGroups.entries()]
      .map(([slug, n]) => ({
        label: groupName.get(slug) ?? slug,
        value: n,
        extra: completions ? `in ${pct(Math.min(1, n / completions))} der Quizze` : "",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);
    sections.push(
      `<section><h2>Top-Gruppen in den Ergebnissen</h2>
       <p class="sub">Wie oft eine Gruppe in den Top 5 eines abgeschlossenen Quiz auftauchte (${completions} Abschlüsse im Zeitraum).</p>
       ${hbarChart(rows)}${table(["Gruppe", "Top-5-Auftritte", "Anteil"], rows.map((r) => [r.label, r.value, r.extra]))}</section>`,
    );
  }

  // --- 5b Funnel & Conversion ----------------------------------------------
  if (data.live && (data.clicksByGroup?.size || starts > 0)) {
    const sum = (m) => [...(m ?? new Map()).values()].reduce((a, b) => a + b, 0);
    const clicksTotal = sum(data.clicksByGroup);
    const resultClicks = data.clickContexts?.get("results") ?? 0;
    const steps = [
      ["Quiz-Starts", starts],
      ["Abschlüsse", completions],
      ["Gruppen-Klicks aus den Ergebnissen", resultClicks],
    ];
    // Per-platform tiles: the three known destinations always show (0 counts
    // included), unknown future dests are appended dynamically.
    const dests = data.clickDests ?? new Map();
    const DEST_LABELS = new Map([
      ["website", "Website-Klicks"],
      ["instagram", "Instagram-Klicks"],
      ["email", "E-Mail-Klicks (Kontaktabsicht)"],
    ]);
    const destTiles = [
      ...[...DEST_LABELS.keys()],
      ...[...dests.keys()].filter((d) => !DEST_LABELS.has(d)),
    ].map((d) => [DEST_LABELS.get(d) ?? `${d}-Klicks`, dests.get(d) ?? 0]);
    const topClicked = [...(data.clicksByGroup ?? new Map()).entries()]
      .map(([slug, n]) => ({ label: groupName.get(slug) ?? slug, value: n }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
    sections.push(
      `<section><h2>Funnel: Vom Quiz zur Gruppe</h2>
       <p class="sub">Wie weit kommen die Leute? Klicks auf Website/Instagram/E-Mail einer Gruppe sind das
       stärkste messbare Signal für „will Kontakt aufnehmen". Achtung: Zählung sind <em>Klicks</em>,
       nicht eindeutige Personen (jemand kann mehrere Gruppen anklicken). Was NACH dem Klick
       passiert, sehen wir nicht mehr — dafür tragen alle ausgehenden Links UTM-Parameter
       (<code>utm_source=fomo-dresden</code>) und E-Mails den Betreff „Anfrage über FOMO", sodass
       die Gruppen selbst FOMO-Zulauf erkennen und nach der Erstiwoche befragt werden können.</p>
       <div class="tiles">${steps
         .map(([l, v]) => `<div class="tile"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`)
         .join("")}</div>
       <h3>Welche Plattform wird angeklickt?</h3>
       <p class="sub">Alle Gruppen-Klicks im Zeitraum (Browsen + Ergebnisse + Profilseiten), gesamt: ${clicksTotal}.</p>
       <div class="tiles">${destTiles
         .map(([l, v]) => `<div class="tile"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`)
         .join("")}</div>
       ${topClicked.length ? `<h3>Meistgeklickte Gruppen</h3>${hbarChart(topClicked)}` : ""}
       ${table(["Gruppe", "Klicks"], topClicked.map((r) => [r.label, r.value]))}</section>`,
    );
  }

  // --- 5c Selbsterkennung (Algorithmus-Güte) --------------------------------
  if (data.live && data.selfRecRanks?.size) {
    const ranks = data.selfRecRanks;
    const nonMembers = ranks.get("n/a") ?? 0;
    const absent = ranks.get("absent") ?? 0;
    const filtered = ranks.get("filtered") ?? 0;
    const numeric = [...ranks.entries()]
      .filter(([k]) => /^\d+$/.test(k))
      .map(([k, n]) => [parseInt(k, 10), n]);
    const members = numeric.reduce((s, [, n]) => s + n, 0) + absent + filtered;
    const within = (lim) => numeric.filter(([r]) => r <= lim).reduce((s, [, n]) => s + n, 0);
    const rate = (x) => (members ? pct(x / members) : "–");
    sections.push(
      `<section><h2>Selbsterkennung: Findet der Algorithmus die eigene Gruppe?</h2>
       <p class="sub">Mitglieder geben freiwillig an, in welcher Gruppe sie sind — wir prüfen, auf welchem
       Rang unser Matching diese Gruppe für sie platziert hat. Der direkteste Qualitätsmesser für
       Fragen + Algorithmus (ersetzt die verworfene Studie 2). Bisher ${members} Mitglieder-Angaben,
       ${nonMembers} Nicht-Mitglieder.</p>
       <div class="tiles">
         <div class="tile"><div class="v">${rate(within(1))}</div><div class="l">eigene Gruppe auf #1</div></div>
         <div class="tile"><div class="v">${rate(within(3))}</div><div class="l">in den Top 3</div></div>
         <div class="tile"><div class="v">${rate(within(5))}</div><div class="l">in den Top 5</div></div>
         <div class="tile"><div class="v">${members ? pct((absent + filtered) / members) : "–"}</div><div class="l">nicht auffindbar (unverifiziert/gefiltert)</div></div>
       </div>
       ${table(
         ["Rang der eigenen Gruppe", "Anzahl"],
         [...ranks.entries()].sort((a, b) => String(a[0]).localeCompare(String(b[0]), "de", { numeric: true })),
       )}</section>`,
    );
  }

  // --- 5d Geklickt vs. gerankt (revealed preference) -------------------------
  if (data.live && data.picks?.size) {
    let total = 0;
    let decodable = 0;
    let rank1 = 0;
    let beyond3 = 0;
    let gapSum = 0;
    let gapN = 0;
    let ratioSum = 0; // clickedScore / top1Score, weighted — the Quiz-Score
    // Per item: mean |user−clicked| minus |user−top1| (weighted by clicks).
    const itemAcc = new Map(quiz.items.map((it) => [it.id, { d: 0, w: 0 }]));
    const gMap = (g) => {
      const m = {};
      for (const a of g.selfRating.answers) m[a.itemId] = a.value;
      return m;
    };
    for (const [key, n] of data.picks) {
      total += n;
      const [slug, , ...rest] = key.split("|");
      const decoded = decodeR(rest.join("|"));
      const clickedGroup = groups.find((g) => g.slug === slug);
      if (!decoded || !clickedGroup) continue;
      decodable += n;
      const ranked = rankAll(decoded.answers, decoded.filters);
      if (!ranked.length) continue;
      const idx = ranked.findIndex((m) => m.g.slug === slug);
      const clickedScore =
        idx >= 0 ? ranked[idx].score : scoreGroup(decoded.answers, [], clickedGroup);
      if (idx === 0) rank1 += n;
      if (idx > 2 || idx < 0) beyond3 += n;
      gapSum += (ranked[0].score - clickedScore) * n;
      if (ranked[0].score > 0) ratioSum += (clickedScore / ranked[0].score) * n;
      gapN += n;
      const mc = gMap(clickedGroup);
      const mt = gMap(ranked[0].g);
      for (const it of quiz.items) {
        const u = decoded.answers[it.id] ?? 0;
        if (u === 0) continue;
        const acc = itemAcc.get(it.id);
        acc.d += (Math.abs(u - (mc[it.id] ?? 0)) - Math.abs(u - (mt[it.id] ?? 0))) * n;
        acc.w += n;
      }
    }
    const itemRows = quiz.items
      .map((it) => {
        const a = itemAcc.get(it.id);
        return { title: it.shortTitle ?? it.id, text: it.text, delta: a.w ? a.d / a.w : 0, w: a.w };
      })
      .filter((r) => r.w > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    sections.push(
      `<section><h2>Geklickt vs. gerankt: Folgt das Interesse dem Ranking?</h2>
       <p class="sub">Klicks als „ehrliches Interesse": Wir vergleichen die geklickte Gruppe mit den
       Antworten der Person und mit ihrer #1-Empfehlung. Klicken viele eine schlechter platzierte
       Gruppe, gewichtet der Algorithmus etwas anders als das echte Interesse. Zählung in Klicks,
       nicht Personen; kleines n = nur Hinweise.</p>
       <div class="tiles">
         <div class="tile" style="border-width:4px"><div class="v">${gapN ? pct(ratioSum / gapN) : "–"}</div><div class="l">Quiz-Score</div></div>
         <div class="tile"><div class="v">${decodable}</div><div class="l">auswertbare Klicks (von ${total})</div></div>
         <div class="tile"><div class="v">${decodable ? pct(rank1 / decodable) : "–"}</div><div class="l">Klick auf die #1</div></div>
         <div class="tile"><div class="v">${decodable ? pct(beyond3 / decodable) : "–"}</div><div class="l">Klick jenseits der Top 3</div></div>
         <div class="tile"><div class="v">${gapN ? (gapSum / gapN).toFixed(1) : "–"}</div><div class="l">Ø Score-Abstand zur #1 (Punkte)</div></div>
       </div>
       <p class="sub" style="margin-top:10px"><strong>Quiz-Score</strong> = Ø (Match-Score der <em>geklickten</em> Gruppe ÷ Match-Score der #1-Empfehlung).
       100 % = die Leute klicken Gruppen an, die genauso gut zu ihren Antworten passen wie unsere Top-Empfehlung —
       das Quiz trifft ihr Interesse. Je niedriger, desto stärker weicht das echte Interesse vom Ranking ab.
       DIE Kennzahl, um Fragen-/Algorithmus-Änderungen über die Zeit zu vergleichen.</p>
       ${
         itemRows.length
           ? `<h3>Welche Fragen der Algorithmus anders gewichtet als das Interesse</h3>
       <p class="sub">Δ &gt; 0: Bei dieser Frage passt die <em>geklickte</em> Gruppe schlechter zur Antwort als die #1 —
       die Frage zählt fürs Ranking offenbar mehr, als sie den Leuten wichtig ist (Kandidat für geringeres Gewicht in v3).
       Δ &lt; 0: Das Interesse folgt dieser Frage stärker als das Ranking.</p>
       ${table(
         ["Frage", "Δ (Distanz geklickt − #1)", "Basis (Klicks)"],
         itemRows.slice(0, 10).map((r) => [r.text, (r.delta >= 0 ? "+" : "") + r.delta.toFixed(2), r.w]),
       )}`
           : ""
       }</section>`,
    );
  }

  // --- 6 Bias-Analyse -------------------------------------------------------
  {
    const simTop = sim.perGroup.slice(0, 20).map((p) => ({
      label: p.name,
      value: p.rate,
      tip: p.name,
      extra: p.avgRank ? `Ø Rang ${p.avgRank.toFixed(1)}` : "",
    }));
    const never = sim.perGroup.filter((p) => p.rate === 0);
    const noFilter = sim.perGroup.filter((p) => p.filterCount === 0);
    let scatter = "";
    if (data.live && data.resultGroups?.size && completions > 0) {
      const pts = sim.perGroup
        .map((p) => ({
          label: p.name,
          x: p.rate,
          y: Math.min(1, (data.resultGroups.get(p.slug) ?? 0) / completions),
        }))
        .filter((p) => p.x > 0.002 || p.y > 0.002);
      scatter = `<h3>Echt vs. strukturell erwartet</h3>
        <p class="sub">Jeder Punkt eine Gruppe. Auf der Diagonalen: Auftritt wie strukturell erwartet. Deutlich <em>über</em> der Linie: profitiert von echten Antwortmustern; deutlich <em>darunter</em>: kommt trotz struktureller Chance selten vor.</p>
        ${biasScatter(pts)}`;
    }
    sections.push(
      `<section><h2>Hat das Quiz einen Bias?</h2>
       <p class="sub">Simulation: <strong>${sim.n.toLocaleString("de-DE")}</strong> Antwortprofile (gleichverteilt, fester Zufalls-Seed → <strong>reproduzierbar</strong>) gegen den echten Matching-Algorithmus (${groups.length} verifizierte Gruppen). Diese Zahlen ändern sich nur, wenn sich die Gruppenprofile ändern — nicht zwischen zwei Report-Läufen. Wie sich echtes Nutzerverhalten davon unterscheidet, zeigt das Streudiagramm unten.</p>
       <h3>Strukturelle Top-5-Wahrscheinlichkeit (Top 20)</h3>
       <p class="sub">Wie oft eine Gruppe rein rechnerisch in den Top 5 landet — unabhängig davon, wer das Quiz macht. Faire Erwartung bei ${groups.length} Gruppen: ~${pct(5 / groups.length, 1)}.</p>
       ${hbarChart(simTop, (v) => pct(v, 1))}
       ${scatter}
       <h3>Strukturelle Auffälligkeiten</h3>
       <ul class="flags">
         <li><strong>${never.length}</strong> Gruppe(n) erschienen in der Simulation <strong>nie</strong> in den Top 5${never.length ? ": " + esc(never.map((p) => p.name).join(", ")) : ""}.</li>
         <li><strong>${noFilter.length}</strong> Gruppe(n) haben <strong>keine Filter-Angaben</strong> und werden dadurch nie weggefiltert (struktureller Vorteil)${noFilter.length ? ": " + esc(noFilter.map((p) => p.name).slice(0, 8).join(", ")) + (noFilter.length > 8 ? " …" : "") : ""}.</li>
       </ul>
       ${table(
         ["Gruppe", "Top-5-Rate (sim.)", "#1-Rate (sim.)", "Ø Rang", "Neutralantworten", "Filter"],
         sim.perGroup.map((p) => [
           p.name,
           pct(p.rate, 1),
           pct(p.winRate, 1),
           p.avgRank ? p.avgRank.toFixed(1) : "–",
           p.neutralAnswers,
           p.filterCount,
         ]),
       )}</section>`,
    );
  }

  return `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>FOMO Auswertung — ${now}</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box;margin:0}
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#dceef5;color:${C.ink};padding:24px 12px}
  main{max-width:960px;margin:0 auto;display:grid;gap:20px}
  header.hero{background:${C.ink};color:#ADD8E6;padding:24px 28px;border:4px solid ${C.ink}}
  header.hero h1{font-size:26px;text-transform:uppercase;letter-spacing:.5px}
  header.hero p{margin-top:6px;font-size:13px;color:#9fc6d6}
  section{background:${C.surface};border:4px solid ${C.ink};padding:20px 24px}
  h2{font-size:18px;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
  h3{font-size:14px;margin:18px 0 4px}
  .sub{font-size:13px;color:${C.ink2};margin-bottom:12px;max-width:70ch}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:10px}
  .tile{border:2px solid ${C.ink};padding:12px}
  .tile .v{font-size:24px;font-weight:700}
  .tile .l{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:${C.ink2};margin-top:2px}
  .legend{display:flex;gap:16px;font-size:12px;color:${C.ink2};margin-bottom:8px}
  .legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:5px;vertical-align:-1px}
  .nodata{font-size:13px;color:${C.muted};border:2px dashed ${C.grid};padding:14px}
  .flags{font-size:13px;color:${C.ink2};padding-left:18px;display:grid;gap:6px;max-width:80ch}
  details.tbl{margin-top:10px;font-size:12px}
  details.tbl summary{cursor:pointer;color:${C.ink2}}
  details.tbl table{border-collapse:collapse;margin-top:8px;width:100%}
  details.tbl th,details.tbl td{border:1px solid ${C.grid};padding:4px 8px;text-align:left}
  details.tbl th{background:#f6f5f2}
  svg rect:hover,svg circle:hover{opacity:.82}
  #tip{position:fixed;pointer-events:none;background:${C.ink};color:#fff;font-size:12px;padding:6px 9px;border-radius:4px;max-width:340px;white-space:pre-line;display:none;z-index:9}
  footer{font-size:11px;color:${C.ink2};text-align:center;padding:8px}
</style></head><body>
<main>
<header class="hero"><h1>FOMO — Quiz-Auswertung</h1>
<p>Stand ${esc(now)} · Zeitraum: letzte ${DAYS} Tage · ${
    data.live ? "Datenquelle: Umami" : "ohne Live-Daten (nur Simulation)"
  } · anonym, keine Personenbezüge</p></header>
${sections.join("\n")}
<footer>Erzeugt mit <code>npm run report</code> · Simulation gegen den echten Matching-Algorithmus (scripts/report.mjs)</footer>
</main>
<div id="tip"></div>
<script>
const tip=document.getElementById('tip');
document.addEventListener('mousemove',e=>{const t=e.target.closest('[data-tip]');
if(!t){tip.style.display='none';return}
tip.textContent=t.getAttribute('data-tip');tip.style.display='block';
const x=Math.min(e.clientX+14,innerWidth-tip.offsetWidth-8);
tip.style.left=x+'px';tip.style.top=(e.clientY+16)+'px';});
</script>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Fail-soft by design: this also runs inside the Vercel build (prebuild), and
// a flaky Umami API must never block a site deploy — degrade to the
// simulation-only report instead of exiting non-zero.
let data;
try {
  data = await fetchAll();
} catch (e) {
  console.error(`⚠️  Umami-Abruf fehlgeschlagen (${e.message}) — Bericht ohne Live-Daten.`);
  data = { live: false, error: e.message };
}
console.error(`→ Simulation mit ${SIM_N.toLocaleString("de-DE")} Profilen …`);
const sim = simulate();
mkdirSync(dirname(OUT) || ".", { recursive: true });
try {
  writeFileSync(OUT, buildHtml(data, sim));
} catch (e) {
  // Even a template bug must not break the deploy — write a stub instead.
  console.error(`⚠️  Report-Rendering fehlgeschlagen (${e.message}) — schreibe Platzhalter.`);
  writeFileSync(
    OUT,
    `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="robots" content="noindex"><title>FOMO Report</title><p>Report konnte nicht erzeugt werden: ${esc(e.message)}</p>`,
  );
}
console.error(`✅ Bericht geschrieben → ${OUT}`);
if (!data.live) console.error("   (nur Bias-Simulation — für alle Sektionen Umami-Zugang setzen)");
