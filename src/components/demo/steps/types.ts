// SPDX-License-Identifier: AGPL-3.0-only
import type { QuizThesisData, QuizGroupData } from "@/lib/quiz/types";

export interface StepProps {
  theses: QuizThesisData[];
  groups: QuizGroupData[];
  onNext: () => void;
  onPrev: () => void;
  step: number;
  totalSteps: number;
}
