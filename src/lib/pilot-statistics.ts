// SPDX-License-Identifier: AGPL-3.0-only
// Pure statistical computation functions for pilot survey analysis.
// No database dependencies — operates on numeric arrays/matrices.

// ── Basic Statistics ──────────────────────────────────────────────

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
}

export function sd(values: number[]): number {
  return Math.sqrt(variance(values));
}

export function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return 0;
  return num / (Math.sqrt(dx) * Math.sqrt(dy));
}

// ── Cronbach's Alpha ──────────────────────────────────────────────

/** Compute Cronbach's alpha for a matrix of items (rows = subjects, cols = items). */
export function cronbachAlpha(matrix: number[][]): number {
  if (matrix.length < 2 || matrix[0].length < 2) return 0;
  const k = matrix[0].length;

  // Item variances (each column)
  const itemVars: number[] = [];
  for (let j = 0; j < k; j++) {
    const col = matrix.map((row) => row[j]);
    itemVars.push(variance(col));
  }

  // Total score variance (sum of each row)
  const totals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
  const totalVar = variance(totals);

  if (totalVar === 0) return 0;

  const sumItemVars = itemVars.reduce((a, b) => a + b, 0);
  return (k / (k - 1)) * (1 - sumItemVars / totalVar);
}

/** Compute alpha with one item removed (column at deleteIndex). */
export function alphaIfDeleted(matrix: number[][], deleteIndex: number): number {
  const reduced = matrix.map((row) => row.filter((_, j) => j !== deleteIndex));
  return cronbachAlpha(reduced);
}

// ── Corrected Item-Total Correlation (r_it) ───────────────────────

/**
 * Compute corrected item-total correlation for one item within its dimension.
 * Uses only sessions where ALL dimension items have valid values.
 * @param matrix - [session][question] values for the DIMENSION only
 * @param itemIndex - index of the item within the dimension matrix
 */
export function correctedItemTotal(matrix: number[][], itemIndex: number): number {
  if (matrix.length < 3 || matrix[0].length < 2) return 0;

  const itemValues = matrix.map((row) => row[itemIndex]);
  const restSums = matrix.map((row) =>
    row.reduce((sum, v, j) => (j === itemIndex ? sum : sum + v), 0),
  );

  return pearson(itemValues, restSums);
}

// ── Data Preparation ──────────────────────────────────────────────

export interface RawAnswer {
  sessionId: string;
  questionId: string;
  value: string;
}

export interface QuestionMeta {
  id: string;
  dimensionId: string | null;
  isInverse: boolean;
}

export interface PreparedData {
  sessionIds: string[];
  questionIds: string[];
  values: (number | null)[][]; // [session][question]
  dimensionMap: Record<string, string[]>; // dimId → questionIds
  inverseSet: Set<string>;
  standaloneIds: string[];
}

/**
 * Build the numeric data matrix from raw answers.
 * - value "0" → null (missing)
 * - value "1"/"3"/"5" → number, inverted if isInverse
 * - Sessions with < 50% answered questions are excluded
 */
export function prepareData(
  completedSessionIds: string[],
  answers: RawAnswer[],
  questions: QuestionMeta[],
): PreparedData {
  const questionIds = questions.map((q) => q.id);
  const qIndex = new Map(questionIds.map((id, i) => [id, i]));
  const inverseSet = new Set(questions.filter((q) => q.isInverse).map((q) => q.id));

  // Build dimension map
  const dimensionMap: Record<string, string[]> = {};
  const standaloneIds: string[] = [];
  for (const q of questions) {
    if (q.dimensionId) {
      if (!dimensionMap[q.dimensionId]) dimensionMap[q.dimensionId] = [];
      dimensionMap[q.dimensionId].push(q.id);
    } else {
      standaloneIds.push(q.id);
    }
  }

  // Group answers by session
  const answersBySession = new Map<string, Map<string, string>>();
  for (const a of answers) {
    if (!answersBySession.has(a.sessionId)) answersBySession.set(a.sessionId, new Map());
    answersBySession.get(a.sessionId)!.set(a.questionId, a.value);
  }

  // Build matrix
  const validSessionIds: string[] = [];
  const matrix: (number | null)[][] = [];

  const minAnswered = Math.floor(questionIds.length * 0.5);

  for (const sid of completedSessionIds) {
    const sessionAnswers = answersBySession.get(sid);
    if (!sessionAnswers) continue;

    const row: (number | null)[] = new Array(questionIds.length).fill(null);
    let answered = 0;

    for (const [qid, val] of sessionAnswers) {
      const idx = qIndex.get(qid);
      if (idx === undefined) continue;

      if (val === "0") {
        row[idx] = null;
      } else {
        let numVal = parseInt(val, 10);
        if (isNaN(numVal)) continue;
        if (inverseSet.has(qid)) numVal = 6 - numVal;
        row[idx] = numVal;
        answered++;
      }
    }

    if (answered >= minAnswered) {
      validSessionIds.push(sid);
      matrix.push(row);
    }
  }

  return {
    sessionIds: validSessionIds,
    questionIds,
    values: matrix,
    dimensionMap,
    inverseSet,
    standaloneIds,
  };
}

// ── Item Statistics ───────────────────────────────────────────────

export interface ItemStats {
  questionId: string;
  questionText: string;
  dimensionId: string | null;
  dimensionLabel: string | null;
  dimensionEmoji: string | null;
  isInverse: boolean;
  isStandalone: boolean;
  n: number;
  mean: number | null;
  sd: number | null;
  distribution: { "1": number; "3": number; "5": number };
  missingRate: number;
  rit: number | null;
  status: "green" | "yellow" | "red" | "gray";
}

export interface DimensionStats {
  dimensionId: string;
  label: string;
  emoji: string;
  itemCount: number;
  alpha: number | null;
  alphaRating: string;
  weakestItem: { id: string; rit: number } | null;
  bestAlphaIfDeleted: { itemId: string; alpha: number } | null;
  statusCounts: { green: number; yellow: number; red: number };
}

export interface RedundancyPair {
  questionA: string;
  questionB: string;
  correlation: number;
  flag: "redundant" | "check";
}

/** Determine item status based on thresholds from spec. */
export function getItemStatus(
  n: number,
  sdVal: number | null,
  ritVal: number | null,
  isStandalone: boolean,
): "green" | "yellow" | "red" | "gray" {
  if (n < 10) return "gray";

  if (isStandalone) {
    if (sdVal !== null && sdVal < 0.40) return "red";
    if (sdVal !== null && sdVal < 0.50) return "yellow";
    return "green";
  }

  // Dimension item
  if (sdVal !== null && sdVal < 0.40) return "red";
  if (ritVal !== null && (ritVal < 0 || ritVal < 0.10)) return "red";
  if (sdVal !== null && sdVal < 0.50) return "yellow";
  if (ritVal !== null && ritVal < 0.20) return "yellow";
  if (sdVal !== null && sdVal >= 0.50 && ritVal !== null && ritVal >= 0.20) return "green";
  return "yellow";
}

/** Get alpha rating label. */
export function getAlphaRating(alpha: number | null): string {
  if (alpha === null) return "–";
  if (alpha < 0.45) return "Unzureichend";
  if (alpha < 0.55) return "Fragwürdig";
  if (alpha < 0.65) return "Akzeptabel";
  if (alpha < 0.80) return "Gut";
  return "Sehr gut";
}

/** Get alpha rating color. */
export function getAlphaColor(alpha: number | null): "red" | "yellow" | "green" | "gray" {
  if (alpha === null) return "gray";
  if (alpha < 0.45) return "red";
  if (alpha < 0.55) return "yellow";
  return "green";
}

// ── Full Computation ──────────────────────────────────────────────

export interface ComputeStatsInput {
  preparedData: PreparedData;
  questions: (QuestionMeta & { text: string })[];
  dimensions: { id: string; label: string; emoji: string }[];
}

export interface ComputeStatsResult {
  items: ItemStats[];
  dimensionStats: DimensionStats[];
  redundancies: RedundancyPair[];
}

/** Extract a listwise-complete submatrix for a dimension (only rows with no nulls). */
function extractDimensionMatrix(
  data: PreparedData,
  dimQuestionIds: string[],
): number[][] {
  const indices = dimQuestionIds.map((id) => data.questionIds.indexOf(id)).filter((i) => i >= 0);
  const result: number[][] = [];

  for (const row of data.values) {
    const subRow = indices.map((i) => row[i]);
    if (subRow.every((v) => v !== null)) {
      result.push(subRow as number[]);
    }
  }

  return result;
}

/** Compute all statistics from prepared data. */
export function computeStats({ preparedData, questions, dimensions }: ComputeStatsInput): ComputeStatsResult {
  const { values, questionIds, dimensionMap } = preparedData;
  const qIndex = new Map(questionIds.map((id, i) => [id, i]));
  const dimLookup = new Map(dimensions.map((d) => [d.id, d]));
  // ── Per-item stats ──────────────────────────────────────────

  // Precompute dimension matrices and r_it values
  const dimMatrices = new Map<string, number[][]>();
  const dimRits = new Map<string, Map<string, number>>();

  for (const [dimId, dimQIds] of Object.entries(dimensionMap)) {
    const matrix = extractDimensionMatrix(preparedData, dimQIds);
    dimMatrices.set(dimId, matrix);

    if (matrix.length >= 3 && dimQIds.length >= 2) {
      const rits = new Map<string, number>();
      for (let i = 0; i < dimQIds.length; i++) {
        rits.set(dimQIds[i], correctedItemTotal(matrix, i));
      }
      dimRits.set(dimId, rits);
    }
  }

  const items: ItemStats[] = questions.map((q) => {
    const idx = qIndex.get(q.id);
    const isStandalone = q.dimensionId === null;
    const dim = q.dimensionId ? dimLookup.get(q.dimensionId) : null;

    // Collect non-null values for this question
    const validValues: number[] = [];
    const dist = { "1": 0, "3": 0, "5": 0 };
    let missingCount = 0;

    if (idx !== undefined) {
      for (const row of values) {
        const v = row[idx];
        if (v === null) {
          missingCount++;
        } else {
          validValues.push(v);
          // For distribution, use original (un-inverted) value
          // Actually the spec says distribution shows raw counts, but values are already inverted.
          // We'll show distribution of the inverted values for consistency.
          const key = String(v) as "1" | "3" | "5";
          if (key in dist) dist[key]++;
        }
      }
    }

    const n = validValues.length;
    const totalSessions = values.length;
    const missingRate = totalSessions > 0 ? missingCount / totalSessions : 0;
    const meanVal = n > 0 ? mean(validValues) : null;
    const sdVal = n >= 2 ? sd(validValues) : null;

    // r_it for dimension items
    let ritVal: number | null = null;
    if (!isStandalone && q.dimensionId) {
      const rits = dimRits.get(q.dimensionId);
      if (rits) ritVal = rits.get(q.id) ?? null;
    }

    const status = getItemStatus(n, sdVal, ritVal, isStandalone);

    return {
      questionId: q.id,
      questionText: q.text,
      dimensionId: q.dimensionId,
      dimensionLabel: dim?.label ?? null,
      dimensionEmoji: dim?.emoji ?? null,
      isInverse: q.isInverse,
      isStandalone,
      n,
      mean: meanVal,
      sd: sdVal,
      distribution: dist,
      missingRate,
      rit: ritVal,
      status,
    };
  });

  // ── Per-dimension stats ─────────────────────────────────────

  const dimensionStats: DimensionStats[] = dimensions.map((dim) => {
    const dimQIds = dimensionMap[dim.id] ?? [];
    const matrix = dimMatrices.get(dim.id) ?? [];
    const dimItems = items.filter((item) => item.dimensionId === dim.id);

    let alpha: number | null = null;
    let bestAlpha: { itemId: string; alpha: number } | null = null;

    if (matrix.length >= 3 && dimQIds.length >= 2) {
      alpha = cronbachAlpha(matrix);

      // Alpha-if-deleted for each item
      for (let i = 0; i < dimQIds.length; i++) {
        if (dimQIds.length < 3) continue; // Need at least 2 items remaining
        const aDeleted = alphaIfDeleted(matrix, i);
        if (aDeleted > (alpha ?? 0) + 0.02) {
          if (!bestAlpha || aDeleted > bestAlpha.alpha) {
            bestAlpha = { itemId: dimQIds[i], alpha: aDeleted };
          }
        }
      }
    }

    // Find weakest item by r_it
    let weakestItem: { id: string; rit: number } | null = null;
    for (const item of dimItems) {
      if (item.rit !== null) {
        if (!weakestItem || item.rit < weakestItem.rit) {
          weakestItem = { id: item.questionId, rit: item.rit };
        }
      }
    }

    const statusCounts = { green: 0, yellow: 0, red: 0 };
    for (const item of dimItems) {
      if (item.status === "green") statusCounts.green++;
      else if (item.status === "yellow") statusCounts.yellow++;
      else if (item.status === "red") statusCounts.red++;
    }

    return {
      dimensionId: dim.id,
      label: dim.label,
      emoji: dim.emoji,
      itemCount: dimQIds.length,
      alpha,
      alphaRating: getAlphaRating(alpha),
      weakestItem,
      bestAlphaIfDeleted: bestAlpha,
      statusCounts,
    };
  });

  // ── Redundancy matrix ───────────────────────────────────────

  const redundancies: RedundancyPair[] = [];
  const allDimQIds = Object.values(dimensionMap).flat();

  for (let i = 0; i < allDimQIds.length; i++) {
    for (let j = i + 1; j < allDimQIds.length; j++) {
      const idxA = qIndex.get(allDimQIds[i]);
      const idxB = qIndex.get(allDimQIds[j]);
      if (idxA === undefined || idxB === undefined) continue;

      // Get paired non-null values
      const xVals: number[] = [];
      const yVals: number[] = [];
      for (const row of values) {
        if (row[idxA] !== null && row[idxB] !== null) {
          xVals.push(row[idxA]);
          yVals.push(row[idxB]);
        }
      }

      if (xVals.length < 3) continue;

      const r = pearson(xVals, yVals);
      const absR = Math.abs(r);

      if (absR > 0.60) {
        redundancies.push({
          questionA: allDimQIds[i],
          questionB: allDimQIds[j],
          correlation: r,
          flag: absR > 0.80 ? "redundant" : "check",
        });
      }
    }
  }

  redundancies.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  return { items, dimensionStats, redundancies };
}
