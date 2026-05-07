// SPDX-License-Identifier: AGPL-3.0-only
// Client-side matching algorithm for the live quiz
// Runs entirely in the browser — no user data sent to the server (DSGVO)

import type { QuizThesisData, QuizGroupData, QuizMatchResult, AttributeMatch } from "./types";
import { getAttributeLabel } from "./attribute-labels";

/**
 * Compute match scores between user answers and all groups.
 *
 * Answer values from the survey variants:
 *   "5" = Stimme zu (agree)     → normalized 1.0
 *   "3" = Neutral               → normalized 0.5
 *   "1" = Stimme nicht zu       → normalized 0.0
 *   "0" = Nicht verstanden      → skipped
 *   undefined                   → skipped
 *
 * User weight = |normalized - 0.5| × 2  (neutral = 0, agree/disagree = 1.0)
 * Attribute weight = 2 × min(yes, no) / n  (50/50 split = 1.0, all-same = 0.0)
 * Item count normalization = 1 / itemCount_attr  (prevents multi-item attributes from
 *   dominating the score — see ALGORITHM-FIXES.md Track A1)
 * Effective weight = user weight × attribute weight × (1 / itemCount_attr)
 * Similarity per attribute = 1 - |effectiveUserValue - groupAttr|
 * Score = Σ(effectiveWeight × similarity) / Σ(effectiveWeight), normalized to 0-100%
 */
export function computeQuizMatches(
  answers: Record<string, string | string[]>,
  theses: QuizThesisData[],
  groups: QuizGroupData[],
): QuizMatchResult[] {
  const attrWeights = computeAttributeWeights(groups);
  const itemCounts = computeItemCountsPerAttribute(theses);

  return groups
    .map((group) => computeSingleMatch(answers, theses, group, attrWeights, itemCounts))
    .sort((a, b) => b.score - a.score);
}

/**
 * Count how many theses map to each attribute.
 * Used to normalize effective weight so multi-item attributes don't dominate.
 * See CLAUDE-pläne/FOMO-Algorithmus-Fixes-Plan.md Track A1.
 */
export function computeItemCountsPerAttribute(theses: QuizThesisData[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const thesis of theses) {
    for (const mapping of thesis.attributes) {
      counts[mapping.attribute] = (counts[mapping.attribute] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Compute discriminative power per attribute across all groups.
 * Attributes where all groups are the same get weight 0 (e.g. leadershipOpportunities=100%).
 * Attributes with ~50/50 split get weight 1.0 (most discriminating).
 */
function computeAttributeWeights(groups: QuizGroupData[]): Record<string, number> {
  const n = groups.length;
  if (n === 0) return {};

  const weights: Record<string, number> = {};
  const attrs = groups.length > 0 ? Object.keys(groups[0].attributes) : [];

  for (const attr of attrs) {
    const yes = groups.filter((g) => g.attributes[attr] === true).length;
    const no = n - yes;
    const balance = Math.min(yes, no) / n;
    weights[attr] = balance * 2; // 0.0–1.0
  }

  return weights;
}

function normalizeAnswer(raw: string | string[] | undefined): number | null {
  if (raw === undefined || raw === "0") return null;
  const val = typeof raw === "string" ? raw : raw[0];
  const num = parseInt(val, 10);
  if (isNaN(num)) return null;
  // Map 1→0.0, 3→0.5, 5→1.0
  return (num - 1) / 4;
}

/**
 * V2 matching: mean-absolute-distance over WS2 item vectors.
 * Used when a group has a GroupSelfRating; fallback to computeSingleMatch otherwise.
 * User answers come from the quiz as "1"|"3"|"5" and are converted to -1|0|1.
 */
export function computeV2Match(
  userAnswers: Record<string, string | string[]>,  // raw quiz answers (thesis id → "1"|"3"|"5")
  thesisToItemMap: Record<string, string>,         // thesisId → WS2 itemId
  groupAnswers: Array<{ itemId: string; value: number }>,
  filterSelections: string[],       // user's filter choices (attribute IDs)
  groupFilterSelections: string[],  // group's filter choices (attribute IDs)
): number {
  // Hard constraint: if both user and group have filter selections and there is no overlap → 0
  if (filterSelections.length > 0 && groupFilterSelections.length > 0) {
    const hasOverlap = filterSelections.some((f) => groupFilterSelections.includes(f));
    if (!hasOverlap) return 0;
  }

  const groupMap = Object.fromEntries(groupAnswers.map((a) => [a.itemId, a.value]));

  // Convert quiz answers from "1"/"3"/"5" scale to -1/0/1
  const userVec: Record<string, number> = {};
  for (const [thesisId, itemId] of Object.entries(thesisToItemMap)) {
    const raw = userAnswers[thesisId];
    if (!raw) continue;
    const val = typeof raw === "string" ? raw : raw[0];
    const num = parseInt(val, 10);
    if (isNaN(num) || num === 0) continue;
    // 5 → 1, 3 → 0, 1 → -1
    userVec[itemId] = num === 5 ? 1 : num === 1 ? -1 : 0;
  }

  // Only use items where user has non-neutral answer
  const activeItems = Object.entries(userVec).filter(([, v]) => v !== 0);
  if (activeItems.length === 0) return 50;

  const totalDist = activeItems.reduce((sum, [itemId, u]) => {
    const g = groupMap[itemId] ?? 0;
    return sum + Math.abs(u - g); // max distance = 2
  }, 0);

  const maxDist = activeItems.length * 2;
  return Math.round((1 - totalDist / maxDist) * 100);
}

function computeSingleMatch(
  answers: Record<string, string | string[]>,
  theses: QuizThesisData[],
  group: QuizGroupData,
  attrWeights: Record<string, number>,
  itemCounts: Record<string, number>,
): QuizMatchResult {
  let weightSum = 0;
  let scoreSum = 0;
  const attributeMatches: AttributeMatch[] = [];
  const seenAttributes = new Set<string>();

  for (const thesis of theses) {
    const normalized = normalizeAnswer(answers[thesis.id]);
    if (normalized === null) continue;

    const userWeight = Math.abs(normalized - 0.5) * 2;
    if (userWeight < 0.001) continue; // Neutral → skip

    for (const mapping of thesis.attributes) {
      const groupAttr = group.attributes[mapping.attribute];
      if (groupAttr === undefined) continue;

      const attrWeight = attrWeights[mapping.attribute] ?? 1;
      // Normalize by item count so attributes with multiple theses don't dominate
      const itemCount = itemCounts[mapping.attribute] ?? 1;
      const effectiveWeight = userWeight * attrWeight * (1 / itemCount);

      const groupVal = groupAttr ? 1 : 0;
      const effectiveUser = mapping.isInverse ? 1 - normalized : normalized;
      const similarity = 1 - Math.abs(effectiveUser - groupVal);

      weightSum += effectiveWeight;
      scoreSum += effectiveWeight * similarity;

      // Track per-attribute match (first thesis wins for display)
      if (!seenAttributes.has(mapping.attribute)) {
        seenAttributes.add(mapping.attribute);
        attributeMatches.push({
          attribute: mapping.attribute,
          label: getAttributeLabel(mapping.attribute),
          groupHas: groupAttr,
          userAgrees: effectiveUser >= 0.5,
          similarity,
          category: similarity >= 0.75 ? "match" : similarity <= 0.25 ? "conflict" : "partial",
        });
      }
    }
  }

  const score = weightSum > 0 ? Math.round((scoreSum / weightSum) * 100) : 50;

  // Sort: matches first, then partials, then conflicts
  attributeMatches.sort((a, b) => b.similarity - a.similarity);

  return { group, score, attributeMatches };
}
