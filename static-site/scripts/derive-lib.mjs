// SPDX-License-Identifier: AGPL-3.0-only
//
// Shared feature encoding + per-item value derivation used by both
// derive-selfrating.mjs (apply) and train-derive-model.mjs (learn). Keeping the
// encoding in one place guarantees training and application stay in sync.

/** The 17 binary attributes a scraper provides (order-independent). */
export const BINARY_ATTRS = [
  "career", "tech", "socialImpact", "party", "religion", "sports", "networking",
  "arts", "music", "timeLow", "handsOn", "outdoor", "international",
  "beginnerFriendly", "competitive", "financialCost", "leadershipOpportunities",
];

const ORDINAL = {
  groupSize: { small: -1, medium: 0, large: 1 },
  eventFrequency: { low: -1, medium: 0, high: 1 },
  language: { german: -1, both: 1, english: 1 },
};

/** Numeric feature vector for a (scraped) group. Keys are stable across runs. */
export function featureVector(group) {
  const f = {};
  for (const a of BINARY_ATTRS) f[a] = group.attributes?.[a] === true ? 1 : 0;
  for (const [field, map] of Object.entries(ORDINAL)) {
    f[field] = map[group[field]] ?? 0;
  }
  return f;
}

export const FEATURE_KEYS = [...BINARY_ATTRS, ...Object.keys(ORDINAL)];

const VALUE_MAP_FIELD = { groupSize: "groupSize", eventFrequency: "eventFrequency", language: "language" };
const clamp = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** Hand-coded mapping: derive an item's -1|0|1 from quiz.json item.attributes. */
export function naiveItemValue(group, item) {
  const contributions = [];
  for (const m of item.attributes) {
    let raw;
    if (m.valueMap) {
      const field = VALUE_MAP_FIELD[m.attribute];
      const fieldVal = field ? group[field] : undefined;
      raw = fieldVal != null && m.valueMap[fieldVal] != null ? m.valueMap[fieldVal] : 0;
    } else {
      const attrVal = group.attributes?.[m.attribute];
      raw = attrVal === true ? 1 : attrVal === false ? -1 : 0;
    }
    if (m.isInverse) raw = -raw;
    contributions.push(raw);
  }
  if (contributions.length === 0) return 0;
  return clamp(Math.round(contributions.reduce((a, b) => a + b, 0) / contributions.length));
}

/** Learned mapping for one item: sign of a weighted sum of features. */
export function learnedItemValue(group, itemModel, threshold) {
  const f = featureVector(group);
  let s = 0;
  for (const [key, w] of Object.entries(itemModel.weights)) s += (f[key] ?? 0) * w;
  return s > threshold ? 1 : s < -threshold ? -1 : 0;
}

/** Pearson correlation, 0 when either side has no variance. */
export function corr(xs, ys) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx > 0 && dy > 0 ? num / Math.sqrt(dx * dy) : 0;
}
