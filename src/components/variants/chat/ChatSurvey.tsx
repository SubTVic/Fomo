// SPDX-License-Identifier: AGPL-3.0-only
// Chat variant: messenger-style, questions as bot messages with typing indicator
// In multi-variant mode, only shows the assigned blockQuestions

"use client";

import { useEffect, useRef, useState } from "react";
import { getDimension } from "@/lib/pilot-questions";
import type { SurveyVariantProps } from "@/components/variants/types";

const LIKERT_CHAT = [
  { value: "1", emoji: "👎", label: "Nein" },
  { value: "3", emoji: "😐", label: "Egal" },
  { value: "5", emoji: "👍", label: "Ja" },
];

interface ChatMessage {
  id: string;
  from: "bot" | "user";
  text: string;
}

export function ChatSurvey({
  state,
  setAnswer,
  blockQuestions,
  onBlockComplete,
}: SurveyVariantProps) {
  const { answers } = state;
  const [localIdx, setLocalIdx] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasShownCurrent, setHasShownCurrent] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);

  const question = blockQuestions[localIdx] ?? blockQuestions[0];
  const dimension = getDimension(question.dimensionId);
  const currentValue = answers[question.id] as string | undefined;
  const alreadyAnswered = currentValue !== undefined;
  const isLast = localIdx === blockQuestions.length - 1;

  const blockAnswered = blockQuestions.filter((q) => answers[q.id] !== undefined).length;
  const blockProgress = Math.round((blockAnswered / blockQuestions.length) * 100);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Show question as bot message when localIdx changes
  useEffect(() => {
    if (hasShownCurrent === localIdx) return;

    setIsTyping(true);
    const timer = setTimeout(() => {
      setIsTyping(false);
      setHasShownCurrent(localIdx);
      setMessages((prev) => [
        ...prev,
        {
          id: `q-${question.id}`,
          from: "bot",
          text: question.text,
        },
      ]);
    }, 600);

    return () => clearTimeout(timer);
  }, [localIdx, question, hasShownCurrent]);

  // Init: greeting on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          id: "greeting",
          from: "bot",
          text: `Hey! Weiter geht's mit ${blockQuestions.length} Fragen im Chat-Stil. Antworte mit Ja, Nein oder Egal!`,
        },
      ]);
    }, 400);
    return () => clearTimeout(timer);
  }, [blockQuestions.length]);

  function handleAnswer(value: string) {
    const label = value === "0" ? "Ich hab die Frage nicht verstanden" : (LIKERT_CHAT.find((l) => l.value === value)?.label ?? value);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${question.id}`,
        from: "user",
        text: label,
      },
    ]);
    setAnswer(question.id, value);
    setTimeout(() => {
      if (isLast) onBlockComplete();
      else setLocalIdx((i) => i + 1);
    }, 300);
  }

  return (
    <div className="min-h-screen bg-[#0b141a] flex flex-col text-white">
      {/* Chat header */}
      <header className="flex-shrink-0 px-4 py-3 flex items-center gap-3 bg-[#202c33] border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-[#ADD8E6] flex items-center justify-center text-xl">
          🤖
        </div>
        <div className="flex-1">
          <p className="font-heading text-sm uppercase">FOMO-Bot</p>
          <p className="text-xs text-white/50">
            {blockAnswered} / {blockQuestions.length} beantwortet
          </p>
        </div>
        <div className="text-xs text-white/40 tabular-nums">{blockProgress}%</div>
      </header>

      {/* Progress */}
      <div className="h-0.5 bg-white/5 flex-shrink-0">
        <div
          className="h-full bg-[#ADD8E6] transition-all duration-500"
          style={{ width: `${blockProgress}%` }}
        />
      </div>

      {/* Dimension indicator */}
      <div className="flex-shrink-0 px-4 py-1.5 bg-[#0b141a] border-b border-white/5">
        <span className="text-xs text-white/40">
          {dimension.emoji} {dimension.label}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.from === "bot" && (
              <div className="w-7 h-7 rounded-full bg-[#ADD8E6] flex items-center justify-center text-sm mr-2 flex-shrink-0 self-end">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.from === "bot"
                  ? "bg-[#202c33] text-white/90 rounded-bl-sm"
                  : "bg-[#005c4b] text-white rounded-br-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-[#ADD8E6] flex items-center justify-center text-sm">
              🤖
            </div>
            <div className="bg-[#202c33] rounded-xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Answer buttons */}
      {!isTyping && !alreadyAnswered && hasShownCurrent === localIdx && (
        <div className="flex-shrink-0 border-t border-white/10 bg-[#202c33] p-3">
          <div className="flex gap-2">
            {LIKERT_CHAT.map(({ value, emoji, label }) => (
              <button
                key={value}
                onClick={() => handleAnswer(value)}
                className="flex-1 flex flex-col items-center gap-0.5 rounded-xl bg-[#2a3942] border border-white/10 py-2.5 text-xs font-medium hover:bg-[#ADD8E6]/20 hover:border-[#ADD8E6]/50 transition-colors active:scale-95"
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-white/70">{label}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => handleAnswer("0")}
            className="w-full mt-2 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-left text-white/40 hover:bg-yellow-900/20 hover:border-yellow-700/50 transition-colors active:scale-95"
          >
            <span className="text-xs font-medium">Ich hab die Frage nicht verstanden</span>
            <span className="block text-[11px] text-white/25 mt-0.5">
              Hilft uns, unklare Fragen zu verbessern
            </span>
          </button>
        </div>
      )}

      {/* Already answered: show next */}
      {alreadyAnswered && (
        <div className="flex-shrink-0 border-t border-white/10 bg-[#202c33] px-4 py-3 flex justify-end">
          <button
            onClick={() => {
              if (isLast) onBlockComplete();
              else setLocalIdx((i) => i + 1);
            }}
            className="rounded-lg bg-[#ADD8E6] px-5 py-2 text-sm font-medium"
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  );
}
