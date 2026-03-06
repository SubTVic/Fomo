// SPDX-License-Identifier: AGPL-3.0-only

import type { QuizAnswers, GroupWithProfile, MatchResult } from "@/types";

// Similarity functions per question type

function similarityLikertOrSlider(user: number, group: number, max: number): number {
  return 1 - Math.abs(user - group) / max;
}

function similarityYesNo(user: number, group: number): number {
  return user === group ? 1 : 0;
}

function similaritySingleChoice(user: string, group: string): number {
  return user === group ? 1 : 0;
}

function similarityMultiChoice(userValues: string[], groupValues: string[]): number {
  if (userValues.length === 0 && groupValues.length === 0) return 1;
  const intersection = userValues.filter((v) => groupValues.includes(v));
  const union = new Set([...userValues, ...groupValues]);
  return intersection.length / union.size;
}

// Main matching function — runs entirely in the browser, no data sent to server
export function computeMatches(
  answers: QuizAnswers,
  groups: GroupWithProfile[]
): MatchResult[] {
  const results: MatchResult[] = groups.map((group) => {
    let totalWeight = 0;
    let weightedScore = 0;

    for (const profile of group.profiles) {
      const userAnswer = answers[profile.questionId];
      if (userAnswer === undefined) continue;

      const weight = profile.weight * profile.question.weight;
      totalWeight += weight;

      let similarity = 0;
      const type = profile.question.type;

      if (type === "LIKERT") {
        similarity = similarityLikertOrSlider(Number(userAnswer), Number(profile.answerValue), 4);
      } else if (type === "SLIDER") {
        const max = (profile.question.sliderMax ?? 100) - (profile.question.sliderMin ?? 0);
        similarity = similarityLikertOrSlider(Number(userAnswer), Number(profile.answerValue), max);
      } else if (type === "YES_NO") {
        similarity = similarityYesNo(Number(userAnswer), Number(profile.answerValue));
      } else if (type === "SINGLE_CHOICE") {
        similarity = similaritySingleChoice(String(userAnswer), profile.answerValue);
      } else if (type === "MULTI_CHOICE") {
        const userArr = Array.isArray(userAnswer) ? userAnswer : String(userAnswer).split(",").filter(Boolean);
        const groupArr = profile.answerValue.split(",").filter(Boolean);
        similarity = similarityMultiChoice(userArr, groupArr);
      }

      weightedScore += weight * similarity;
    }

    const score = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
    return { group, score: Math.round(score) };
  });

  return results
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
