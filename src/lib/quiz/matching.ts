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
 * Weight = |normalized - 0.5| × 2  (neutral = 0 weight, agree/disagree = 1.0)
 * Similarity per attribute = 1 - |effectiveUserValue - groupAttr|
 *   where effectiveUserValue is flipped (1-value) for inverse mappings
 * Score = Σ(weight × similarity) / Σ(weight), normalized to 0-100%
 */
export function computeQuizMatches(
  answers: Record<string, string | string[]>,
  theses: QuizThesisData[],
  groups: QuizGroupData[],
): QuizMatchResult[] {
  return groups
    .map((group) => computeSingleMatch(answers, theses, group))
    .sort((a, b) => b.score - a.score);
}

function normalizeAnswer(raw: string | string[] | undefined): number | null {
  if (raw === undefined || raw === "0") return null;
  const val = typeof raw === "string" ? raw : raw[0];
  const num = parseInt(val, 10);
  if (isNaN(num)) return null;
  // Map 1→0.0, 3→0.5, 5→1.0
  return (num - 1) / 4;
}

function computeSingleMatch(
  answers: Record<string, string | string[]>,
  theses: QuizThesisData[],
  group: QuizGroupData,
): QuizMatchResult {
  let weightSum = 0;
  let scoreSum = 0;
  const attributeMatches: AttributeMatch[] = [];
  const seenAttributes = new Set<string>();

  for (const thesis of theses) {
    const normalized = normalizeAnswer(answers[thesis.id]);
    if (normalized === null) continue;

    const weight = Math.abs(normalized - 0.5) * 2;
    if (weight < 0.001) continue; // Neutral → skip

    for (const mapping of thesis.attributes) {
      const groupAttr = group.attributes[mapping.attribute];
      if (groupAttr === undefined) continue;

      const groupVal = groupAttr ? 1 : 0;
      const effectiveUser = mapping.isInverse ? 1 - normalized : normalized;
      const similarity = 1 - Math.abs(effectiveUser - groupVal);

      weightSum += weight;
      scoreSum += weight * similarity;

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
