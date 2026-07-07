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

import { readFileSync, writeFileSync } from "node:fs";
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
function topFive(userAnswers, userFilters) {
  return groups
    .map((g) => ({ g, score: scoreGroup(userAnswers, userFilters, g) }))
    .filter((m) => m.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.g.selfRating.raterCount ?? 0) - (a.g.selfRating.raterCount ?? 0) ||
        a.g.name.localeCompare(b.g.name, "de"),
    )
    .slice(0, 5);
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
  const rows = await api("/event-data/values", { eventName, propertyName });
  const m = new Map();
  for (const row of rows) m.set(String(row.value), Number(row.total));
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
  data.perItem = {};
  for (const item of quiz.items) data.perItem[item.id] = await values("quiz-response", item.id);
  data.respFilters = await values("quiz-response", "filters");
  data.itemViews = await values("quiz-item-view", "index");
  data.resultGroups = await values("quiz-result-group", "group");
  data.resultRanks = await values("quiz-result-group", "rank");
  data.feedback = await values("results-feedback", "value");
  data.clicksByGroup = await values("group-click", "group");
  data.clickContexts = await values("group-click", "context");
  return data;
}

// ---------------------------------------------------------------------------
// Bias simulation against the real matcher.
// ---------------------------------------------------------------------------
function buildSampler(data) {
  // Per-item empirical marginals when live data exists, else uniform.
  const marginals = {};
  for (const item of quiz.items) {
    const m = data.perItem?.[item.id];
    const c = { "-1": 1, 0: 1, 1: 1 };
    if (m) for (const [v, n] of m) if (v in c) c[v] += n;
    const total = c["-1"] + c["0"] + c["1"];
    marginals[item.id] = [c["-1"] / total, c["0"] / total, c["1"] / total];
  }
  // Filter behaviour: probability of "no filter" + weights per filter.
  let pNone = 0.5;
  const fw = new Map(quiz.filters.options.map((o) => [o.attribute, 1]));
  if (data.respFilters && data.respFilters.size) {
    let none = 0;
    let total = 0;
    for (const [v, n] of data.respFilters) {
      total += n;
      if (v === "none") none += n;
      else for (const f of v.split(",")) fw.set(f, (fw.get(f) ?? 0) + n);
    }
    if (total > 0) pNone = none / total;
  }
  const fEntries = [...fw.entries()];
  const fSum = fEntries.reduce((s, [, w]) => s + w, 0);
  return {
    empirical: !!data.perItem,
    answers() {
      const a = {};
      for (const item of quiz.items) {
        const [pN, pZ] = [marginals[item.id][0], marginals[item.id][0] + marginals[item.id][1]];
        const r = Math.random();
        a[item.id] = r < pN ? -1 : r < pZ ? 0 : 1;
      }
      return a;
    },
    filters() {
      if (Math.random() < pNone) return [];
      const n = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3;
      const picked = new Set();
      while (picked.size < n) {
        let r = Math.random() * fSum;
        for (const [f, w] of fEntries) {
          r -= w;
          if (r <= 0) {
            picked.add(f);
            break;
          }
        }
      }
      return [...picked];
    },
  };
}

function simulate(data) {
  const sampler = buildSampler(data);
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
    empirical: sampler.empirical,
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
    const tiles = [
      ["Besucher:innen", data.stats?.visitors?.value ?? "–"],
      ["Seitenaufrufe", data.stats?.pageviews?.value ?? "–"],
      ["Quiz-Starts", starts],
      ["Quiz-Abschlüsse", completions],
      ["Abschlussquote", starts ? pct(completions / starts) : "–"],
      ["Feedback 👍", up + down ? pct(up / (up + down)) : "–"],
    ];
    sections.push(
      `<section><h2>Kernzahlen</h2><div class="tiles">${tiles
        .map(([l, v]) => `<div class="tile"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`)
        .join("")}</div></section>`,
    );
  }

  // --- 2 Antworten pro Frage --------------------------------------------
  {
    let body = noData;
    let tbl = "";
    if (data.live && completions > 0) {
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
       <p class="sub">Simulation: <strong>${sim.n.toLocaleString("de-DE")}</strong> zufällige Antwortprofile gegen den echten Matching-Algorithmus (${groups.length} verifizierte Gruppen). ${sim.empirical ? "Antwort- und Filterwahrscheinlichkeiten aus den echten Daten." : "Gleichverteilte Antworten (noch keine echten Daten als Basis)."}</p>
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
const data = await fetchAll();
console.error(`→ Simulation mit ${SIM_N.toLocaleString("de-DE")} Profilen …`);
const sim = simulate(data);
writeFileSync(OUT, buildHtml(data, sim));
console.error(`✅ Bericht geschrieben → ${OUT}`);
if (!data.live) console.error("   (nur Bias-Simulation — für alle Sektionen Umami-Zugang setzen)");
