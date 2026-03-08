// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prepareData, computeStats } from "@/lib/pilot-statistics";
import type { PilotStatisticsResponse } from "@/types/pilot-statistics";

export interface StatsFilter {
  semester?: string;
  isMember?: string;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter: StatsFilter = {};
  if (searchParams.get("semester")) filter.semester = searchParams.get("semester")!;
  if (searchParams.get("isMember")) filter.isMember = searchParams.get("isMember")!;

  const stats = await computePilotStatistics(filter);
  return NextResponse.json(stats);
}

/** Compute all pilot statistics from DB data. Exported for direct use in server components. */
export async function computePilotStatistics(filter?: StatsFilter): Promise<PilotStatisticsResponse> {
  // Fetch all data
  const [allSessions, allAnswers, allDimensions, allQuestions] = await Promise.all([
    db.pilotSession.findMany({
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        semester: true,
        isMember: true,
        preferredVariant: true,
        _count: { select: { answers: true } },
      },
    }),
    db.pilotAnswer.findMany({
      select: { sessionId: true, questionId: true, value: true },
    }),
    db.pilotDimension.findMany({
      orderBy: { order: "asc" },
      select: { id: true, label: true, emoji: true },
    }),
    db.pilotSurveyQuestion.findMany({
      orderBy: [{ dimensionId: "asc" }, { order: "asc" }],
      select: { id: true, dimensionId: true, text: true, isInverse: true },
    }),
  ]);

  // Apply demographic filters
  let filteredSessions = allSessions;
  if (filter?.semester) {
    filteredSessions = filteredSessions.filter((s) => s.semester === filter.semester);
  }
  if (filter?.isMember) {
    filteredSessions = filteredSessions.filter((s) => s.isMember === filter.isMember);
  }

  // ── Overview ────────────────────────────────────────────────

  const completedSessions = filteredSessions.filter((s) => s.completedAt !== null);
  const totalSessions = filteredSessions.length;

  const durations = completedSessions
    .map((s) => s.completedAt!.getTime() - s.startedAt.getTime())
    .filter((d) => d > 0);
  const avgDurationMinutes = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length / 60000
    : 0;

  const answeredCounts = completedSessions.map((s) => s._count.answers);
  const avgQuestionsAnswered = answeredCounts.length > 0
    ? answeredCounts.reduce((a, b) => a + b, 0) / answeredCounts.length
    : 0;

  // ── Demographics (always computed from ALL sessions, not filtered) ─

  const allCompleted = allSessions.filter((s) => s.completedAt !== null);
  const semester: Record<string, number> = {};
  const membership: Record<string, number> = {};
  const preferredVariant: Record<string, number> = {};

  for (const s of allCompleted) {
    if (s.semester) semester[s.semester] = (semester[s.semester] ?? 0) + 1;
    if (s.isMember) membership[s.isMember] = (membership[s.isMember] ?? 0) + 1;
    if (s.preferredVariant) preferredVariant[s.preferredVariant] = (preferredVariant[s.preferredVariant] ?? 0) + 1;
  }

  // ── Statistical Analysis ────────────────────────────────────

  const completedIds = completedSessions.map((s) => s.id);

  // Filter answers to only include those from filtered sessions
  const filteredAnswers = allAnswers.filter((a) => completedIds.includes(a.sessionId));

  const questionMetas = allQuestions.map((q) => ({
    id: q.id,
    dimensionId: q.dimensionId,
    isInverse: q.isInverse,
    text: q.text,
  }));

  const preparedData = prepareData(completedIds, filteredAnswers, questionMetas);

  const { items, dimensionStats, redundancies } = computeStats({
    preparedData,
    questions: questionMetas,
    dimensions: allDimensions,
  });

  return {
    overview: {
      totalSessions,
      completedSessions: completedSessions.length,
      completionRate: totalSessions > 0
        ? Math.round((completedSessions.length / totalSessions) * 100)
        : 0,
      avgDurationMinutes: Math.round(avgDurationMinutes * 10) / 10,
      avgQuestionsAnswered: Math.round(avgQuestionsAnswered),
    },
    demographics: { semester, membership, preferredVariant },
    items,
    dimensions: dimensionStats,
    redundancies,
  };
}
