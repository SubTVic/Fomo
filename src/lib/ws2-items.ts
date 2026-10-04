// SPDX-License-Identifier: AGPL-3.0-only
// The core item set ("Working Set v2": 21 items + 8 activity filters) that
// groups answer when registering/editing. Must stay identical to
// static-site/data/quiz.json, which students answer on the public site —
// scripts/check-items-sync.mjs enforces that in CI.
import workingSet from "../../data/working-set-v2.json";

export type Ws2Item = {
  id: string;
  pilotQuestionId: string | null;
  text: string;
  shortTitle: string;
  construct: string;
  attributes: Array<{
    attribute: string;
    isInverse: boolean;
    valueMap?: Record<string, number>;
  }>;
};

export type Ws2Filter = {
  question: string;
  subtitle: string;
  options: Array<{ id: string; label: string; attribute: string; groupCount: number }>;
};

export const WS2_ITEMS: Ws2Item[] = workingSet.items as Ws2Item[];
export const WS2_FILTER: Ws2Filter = workingSet.filters as Ws2Filter;

export type Ws2AnswerValue = -1 | 0 | 1;
