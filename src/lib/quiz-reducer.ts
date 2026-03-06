// SPDX-License-Identifier: AGPL-3.0-only

import type { QuizState, QuizAction } from "@/types";

export const initialQuizState: QuizState = {
  currentIndex: 0,
  answers: {},
  skipped: [],
  isComplete: false,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
        // Remove from skipped if user now answered
        skipped: state.skipped.filter((id) => id !== action.questionId),
      };

    case "NEXT":
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
      };

    case "PREV":
      return {
        ...state,
        currentIndex: Math.max(0, state.currentIndex - 1),
      };

    case "SKIP": {
      const alreadySkipped = state.skipped.includes(action.questionId);
      return {
        ...state,
        skipped: alreadySkipped
          ? state.skipped
          : [...state.skipped, action.questionId],
        currentIndex: state.currentIndex + 1,
      };
    }

    case "COMPLETE":
      return { ...state, isComplete: true };

    default:
      return state;
  }
}
