// SPDX-License-Identifier: AGPL-3.0-only
import workingSet from "../../../data/working-set-v2.json";

export type Study2Item = {
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

export type Study2Filter = {
  question: string;
  subtitle: string;
  options: Array<{ id: string; label: string; attribute: string; groupCount: number }>;
};

export const STUDY2_ITEMS: Study2Item[] = workingSet.items as Study2Item[];
export const STUDY2_FILTER: Study2Filter = workingSet.filters as Study2Filter;

export type Study2AnswerValue = -1 | 0 | 1;
