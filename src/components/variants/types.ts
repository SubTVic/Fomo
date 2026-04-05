// SPDX-License-Identifier: AGPL-3.0-only
// Shared interface all survey variant components must implement

import type { UseSurveyStateReturn } from "@/components/survey/useSurveyState";

// Generic question/dimension types used by both quiz and variants
export interface SurveyQuestion {
  id: string;
  dimensionId: string | null;
  text: string;
  hint?: string;
}

export interface SurveyDimension {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

// All variant components receive the full useSurveyState return as props,
// plus block-specific data
export type SurveyVariantProps = UseSurveyStateReturn & {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  blockDimensions: SurveyDimension[];
  blockQuestions: SurveyQuestion[];
  onBlockComplete: () => void;
};
