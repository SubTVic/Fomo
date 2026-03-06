// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { QuestionWithOptions } from "@/types";
import { LikertQuestion } from "./question-types/LikertQuestion";
import { SliderQuestion } from "./question-types/SliderQuestion";
import { YesNoQuestion } from "./question-types/YesNoQuestion";
import { SingleChoiceQuestion } from "./question-types/SingleChoiceQuestion";
import { MultiChoiceQuestion } from "./question-types/MultiChoiceQuestion";

interface QuestionCardProps {
  question: QuestionWithOptions;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}

// Dispatches to the correct question type component based on question.type.
// Adding a new question type = add a case here + a new component file.
export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const commonProps = { question, value, onChange: onChange as (v: string) => void };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold leading-snug">{question.text}</h2>

      {question.type === "LIKERT" && <LikertQuestion {...commonProps} />}
      {question.type === "SLIDER" && <SliderQuestion {...commonProps} />}
      {question.type === "YES_NO" && <YesNoQuestion {...commonProps} />}
      {question.type === "SINGLE_CHOICE" && <SingleChoiceQuestion {...commonProps} />}
      {question.type === "MULTI_CHOICE" && (
        <MultiChoiceQuestion
          question={question}
          value={value}
          onChange={onChange as (v: string[]) => void}
        />
      )}
    </div>
  );
}
