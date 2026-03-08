// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPilotDimensionsWithQuestions, getStandaloneQuestions } from "@/lib/queries/pilot";
import { DeleteSessionButton } from "./DeleteSessionButton";

interface Props {
  params: Promise<{ id: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function formatDateTime(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ANSWER_BADGES: Record<
  string,
  { className: string; label: string }
> = {
  "5": { className: "bg-green-100 text-green-800", label: "Stimme voll zu" },
  "3": { className: "bg-yellow-100 text-yellow-800", label: "Neutral" },
  "1": { className: "bg-red-100 text-red-800", label: "Stimme nicht zu" },
  "0": { className: "bg-muted text-muted-foreground", label: "Keine Angabe" },
};

// ── Page ─────────────────────────────────────────────────────────────

export default async function PilotSessionDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await db.pilotSession.findUnique({
    where: { id },
    include: { answers: true },
  });

  if (!session) notFound();

  const [allDimensions, standaloneQuestions] = await Promise.all([
    getPilotDimensionsWithQuestions(),
    getStandaloneQuestions(),
  ]);

  const answerMap = new Map(
    session.answers.map((a) => [a.questionId, a.value]),
  );

  const isCompleted = session.completedAt !== null;

  // Parse variant order
  let variantOrder = "–";
  if (session.variantOrder) {
    try {
      const parsed = JSON.parse(session.variantOrder) as string[];
      variantOrder = parsed.join(", ");
    } catch {
      variantOrder = session.variantOrder;
    }
  }

  // Compute duration
  let duration = "–";
  if (session.completedAt) {
    const ms =
      session.completedAt.getTime() - session.startedAt.getTime();
    duration = formatDuration(ms);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Back link */}
      <Link
        href="/admin/pilot"
        className="text-sm text-muted-foreground hover:underline"
      >
        &larr; Alle Sessions
      </Link>

      {/* Header */}
      <div className="mb-6 mt-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl uppercase">
            {session.startedAt.toLocaleDateString("de-DE")}
          </h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              isCompleted
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isCompleted ? "Abgeschlossen" : "Abgebrochen"}
          </span>
        </div>
        <DeleteSessionButton sessionId={session.id} />
      </div>

      {/* ── Metadata Card ─────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="border-2 border-foreground bg-card p-6">
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <MetaField label="Variante" value={session.variant} />
            <MetaField label="Varianten-Reihenfolge" value={variantOrder} />
            <MetaField
              label="Präferenz"
              value={session.preferredVariant || "–"}
            />
            <MetaField
              label="Begründung"
              value={session.preferenceReason || "–"}
            />
            <MetaField label="Semester" value={session.semester || "–"} />
            <MetaField label="Mitglied" value={session.isMember || "–"} />
            <MetaField
              label="Gruppen"
              value={session.groupNames || "–"}
            />
            <MetaField
              label="Gestartet"
              value={formatDateTime(session.startedAt)}
            />
            <MetaField
              label="Abgeschlossen"
              value={
                session.completedAt
                  ? formatDateTime(session.completedAt)
                  : "–"
              }
            />
            <MetaField label="Dauer" value={duration} />
            <MetaField
              label="Was war verwirrend"
              value={session.feedbackConfusing || "–"}
            />
            <MetaField
              label="Was hat gefehlt"
              value={session.feedbackMissing || "–"}
            />
          </div>
        </div>
      </section>

      {/* ── Answers by Dimension ──────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="mb-4 font-heading text-xl uppercase">Antworten</h2>

        <div className="space-y-6">
          {allDimensions.map((dim) => {
            const dimQuestions = dim.questions;

            // Compute dimension average (only non-zero answers)
            const numericValues = dimQuestions
              .map((q) => {
                const val = answerMap.get(q.id);
                return val ? parseInt(val, 10) : 0;
              })
              .filter((v) => v > 0);
            const average =
              numericValues.length > 0
                ? numericValues.reduce((a, b) => a + b, 0) /
                  numericValues.length
                : 0;

            return (
              <div key={dim.id}>
                <h3 className="mb-3 font-heading text-lg uppercase">
                  {dim.emoji} {dim.label}
                </h3>

                <div className="border-2 border-foreground bg-card">
                  {dimQuestions.map((q, i) => {
                    const value = answerMap.get(q.id);
                    const badge = value
                      ? (ANSWER_BADGES[value] ?? ANSWER_BADGES["0"])
                      : { className: "bg-muted text-muted-foreground", label: "–" };

                    return (
                      <div
                        key={q.id}
                        className={`flex items-start justify-between gap-4 px-4 py-3 ${
                          i < dimQuestions.length - 1
                            ? "border-b border-foreground/20"
                            : ""
                        }`}
                      >
                        <p className="text-sm">{q.text}</p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Dimension average */}
                  <div className="border-t-2 border-foreground px-4 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Durchschnitt
                      </span>
                      <span className="font-bold tabular-nums">
                        {numericValues.length > 0
                          ? average.toFixed(1)
                          : "–"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Standalone Items */}
          {standaloneQuestions.length > 0 && (
            <div>
              <h3 className="mb-3 font-heading text-lg uppercase">
                Standalone Items
              </h3>
              <div className="border-2 border-foreground bg-card">
                {standaloneQuestions.map((q, i) => {
                  const value = answerMap.get(q.id);
                  const badge = value
                    ? (ANSWER_BADGES[value] ?? ANSWER_BADGES["0"])
                    : { className: "bg-muted text-muted-foreground", label: "–" };

                  return (
                    <div
                      key={q.id}
                      className={`flex items-start justify-between gap-4 px-4 py-3 ${
                        i < standaloneQuestions.length - 1
                          ? "border-b border-foreground/20"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">{q.id}</span>
                        <p className="text-sm">{q.text}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Reusable metadata field ──────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
