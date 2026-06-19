// SPDX-License-Identifier: AGPL-3.0-only
//
// Learn a per-item derivation model from the groups that ALREADY have a real
// self-rating (i.e. registered groups). For each WS2 item it compares the
// hand-coded mapping against a feature-weighted model via leave-one-out CV and
// only marks the item "useLearned" where the learned model clearly wins. The
// result is a small JSON the deriver can apply to NOT-yet-registered groups.
//
// As more groups register, re-run this to get a better model — no app change.
//
//   node scripts/train-derive-model.mjs \
//     --in data/groups.json \          # source of real self-ratings (registered groups)
//     --quiz data/quiz.json \
//     --out data/derive-model.json \
//     --min-gain 0.10                  # min LOO accuracy gain to prefer learned
//
// Honest caveat: with few registrations this is a weak signal — the model is a
// fallback for unregistered groups, never a replacement for registration.

import { readFileSync, writeFileSync } from "node:fs";
import { featureVector, FEATURE_KEYS, naiveItemValue, corr } from "./derive-lib.mjs";

const args = process.argv.slice(2);
const getArg = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const inPath = getArg("--in", "data/groups.json");
const quizPath = getArg("--quiz", "data/quiz.json");
const outPath = getArg("--out", "data/derive-model.json");
const minGain = parseFloat(getArg("--min-gain", "0.10"));
const THRESHOLD = 0.15;

const input = JSON.parse(readFileSync(inPath, "utf8"));
const quiz = JSON.parse(readFileSync(quizPath, "utf8"));
const allGroups = input.groups ?? input;

// Train only on real (registered, non-derived) self-ratings.
const train = allGroups.filter((g) => g.selfRating?.answers?.length && !g.selfRating?.derived);
if (train.length < 12) {
  console.error(
    `Only ${train.length} registered groups — too few to train reliably. ` +
      `Skipping; the deriver will use the hand-coded mapping.`,
  );
  process.exit(1);
}

const realOf = (g) => Object.fromEntries(g.selfRating.answers.map((a) => [a.itemId, a.value]));
const reals = train.map(realOf);
const feats = train.map(featureVector);

/** Leave-one-out sign-agreement (on non-neutral targets) of a predictor. */
function looAccuracy(predict) {
  let tot = 0, ok = 0;
  for (let k = 0; k < train.length; k++) {
    for (const item of quiz.items) {
      const rv = reals[k][item.id];
      if (rv === undefined || rv === 0) continue;
      const pv = predict(k, item);
      tot++;
      if (pv !== 0 && pv > 0 === rv > 0) ok++;
    }
  }
  return tot ? ok / tot : 0;
}

// Naive predictor (no training).
const naivePred = (k, item) => naiveItemValue(train[k], item);

// Learned predictor: weights = corr(feature, target) on the training fold.
function learnedPred(k, item) {
  const trIdx = [...Array(train.length).keys()].filter((j) => j !== k);
  const ys = trIdx.map((j) => reals[j][item.id]);
  let s = 0;
  for (const key of FEATURE_KEYS) {
    const w = corr(trIdx.map((j) => feats[j][key]), ys);
    s += w * feats[k][key];
  }
  return s > THRESHOLD ? 1 : s < -THRESHOLD ? -1 : 0;
}

function itemLooAcc(predict, item) {
  let tot = 0, ok = 0;
  for (let k = 0; k < train.length; k++) {
    const rv = reals[k][item.id];
    if (rv === undefined || rv === 0) continue;
    const pv = predict(k, item);
    tot++;
    if (pv !== 0 && pv > 0 === rv > 0) ok++;
  }
  return tot ? ok / tot : 0;
}
function round3(x) {
  return Math.round(x * 1000) / 1000;
}

// Per-item decision + full-data weights for application.
const itemsModel = {};
const perItem = [];
for (const item of quiz.items) {
  const naiveAcc = itemLooAcc(naivePred, item);
  const learnedAcc = itemLooAcc(learnedPred, item);
  const useLearned = learnedAcc > naiveAcc + minGain;
  const weights = {};
  if (useLearned) {
    const ys = reals.map((r) => r[item.id]);
    for (const key of FEATURE_KEYS) weights[key] = round3(corr(feats.map((f) => f[key]), ys));
  }
  itemsModel[item.id] = { useLearned, weights, naiveAcc: round3(naiveAcc), learnedAcc: round3(learnedAcc) };
  perItem.push({ id: item.id, useLearned });
}

const overallNaive = looAccuracy(naivePred);
const hybridPred = (k, item) =>
  itemsModel[item.id].useLearned ? learnedPred(k, item) : naivePred(k, item);
const overallHybrid = looAccuracy(hybridPred);

const model = {
  version: 1,
  trainedAt: new Date().toISOString(),
  trainedOnGroups: train.length,
  threshold: THRESHOLD,
  features: FEATURE_KEYS,
  overall: { naive: round3(overallNaive), hybrid: round3(overallHybrid) },
  items: itemsModel,
};
writeFileSync(outPath, JSON.stringify(model, null, 2) + "\n");

console.log(`Trained on ${train.length} registered groups.`);
console.log(
  `Overall LOO sign-agreement: naive ${(overallNaive * 100).toFixed(0)}% → hybrid ${(overallHybrid * 100).toFixed(0)}%`,
);
const used = perItem.filter((p) => p.useLearned).map((p) => p.id);
console.log(`Items using the learned mapping (${used.length}): ${used.join(", ") || "none"}`);
console.log(`Wrote model → ${outPath}`);
