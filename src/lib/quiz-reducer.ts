// SPDX-License-Identifier: AGPL-3.0-only

import type { QuizState, QuizAction } from "@/types";

export const initialQuizState: QuizState = {
  currentIndex: 0,
  answers: {},
  isComplete: false,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "ANSWER":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.value },
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

    case "COMPLETE":
      return { ...state, isComplete: true };

    default:
      return state;
  }
}
