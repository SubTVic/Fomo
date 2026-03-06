// SPDX-License-Identifier: AGPL-3.0-only
// Shared interface all survey variant components must implement

import type { Dimension, PilotQuestion } from "@/lib/pilot-questions";
import type { UseSurveyStateReturn } from "@/components/survey/useSurveyState";

// All variant components receive the full useSurveyState return as props,
// plus block-specific data for the multi-variant flow
export type SurveyVariantProps = UseSurveyStateReturn & {
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  // Block-specific: which dimensions/questions this variant should display
  blockDimensions: Dimension[];
  blockQuestions: PilotQuestion[];
  // Called when user finishes this block's questions
  onBlockComplete: () => void;
};
