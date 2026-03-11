// SPDX-License-Identifier: AGPL-3.0-only

import type {
  LiveGroup,
  LiveQuestion,
  UserAnswer,
  LiveMatchResult,
  AttributeMatch,
  GroupAttribute,
} from "./types";
import { ATTRIBUTE_LABELS } from "./questions";

// ---------------------------------------------------------------------------
// Live Quiz matching — runs 100% in the browser, no data sent to server
// ---------------------------------------------------------------------------

/**
 * Normalize a user answer to a 0–1 value.
 * agree → 1.0, neutral → 0.5, disagree → 0.0
 */
function normalizeAnswer(value: "agree" | "neutral" | "disagree"): number {
  if (value === "agree") return 1.0;
  if (value === "disagree") return 0.0;
  return 0.5;
}

/**
 * Compute the weight of an answer based on opinion strength.
 * weight = |normalized - 0.5| × 2
 * Agree/Disagree → 1.0, Neutral → 0.0 (not counted)
 */
function computeWeight(normalized: number, doubleWeight: boolean): number {
  const base = Math.abs(normalized - 0.5) * 2;
  return doubleWeight ? base * 2 : base;
}

/**
 * Compute similarity between user value and group attribute.
 * For inverse mappings the user value is flipped.
 */
function computeSimilarity(
  userNormalized: number,
  groupAttr: 0 | 1,
  inverse: boolean,
): number {
  const effectiveUser = inverse ? 1 - userNormalized : userNormalized;
  return 1 - Math.abs(effectiveUser - groupAttr);
}

/**
 * Categorize a similarity score for display.
 */
function categorize(similarity: number): "match" | "partial" | "conflict" {
  if (similarity >= 0.75) return "match";
  if (similarity <= 0.25) return "conflict";
  return "partial";
}

/**
 * Compute match results for all groups based on user answers.
 * Returns results sorted by score (best first), normalized to 0–100%.
 */
export function computeLiveMatches(
  answers: (UserAnswer | null)[],
  questions: LiveQuestion[],
  groups: LiveGroup[],
): LiveMatchResult[] {
  return groups
    .map((group) => {
      let totalWeight = 0;
      let weightedScore = 0;

      // Track best similarity per attribute for display
      const attrBest = new Map<
        GroupAttribute,
        { similarity: number; weight: number }
      >();

      for (let i = 0; i < questions.length; i++) {
        const answer = answers[i];
        if (!answer || answer.value === null || answer.value === "neutral")
          continue;

        const question = questions[i];
        const normalized = normalizeAnswer(answer.value);
        const weight = computeWeight(normalized, answer.doubleWeight);

        if (weight === 0) continue;

        for (const mapping of question.mappings) {
          const groupAttrValue = group.attributes[mapping.attribute];
          const similarity = computeSimilarity(
            normalized,
            groupAttrValue,
            mapping.inverse ?? false,
          );

          totalWeight += weight;
          weightedScore += weight * similarity;

          // Keep the best (highest-weight) similarity per attribute
          const existing = attrBest.get(mapping.attribute);
          if (!existing || weight > existing.weight) {
            attrBest.set(mapping.attribute, { similarity, weight });
          }
        }
      }

      const score =
        totalWeight > 0
          ? Math.round((weightedScore / totalWeight) * 100)
          : 50;

      // Build attribute match list
      const attributeMatches: AttributeMatch[] = Array.from(
        attrBest.entries(),
      ).map(([attribute, { similarity }]) => ({
        attribute,
        label: ATTRIBUTE_LABELS[attribute],
        similarity,
        category: categorize(similarity),
      }));

      return { group, score, attributeMatches };
    })
    .sort((a, b) => b.score - a.score);
}
