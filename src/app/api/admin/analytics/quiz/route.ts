// SPDX-License-Identifier: AGPL-3.0-only
// API: Quiz analytics for the admin dashboard

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const semester = req.nextUrl.searchParams.get("semester") ?? undefined;
  const where = semester ? { semester } : {};

  // Overview stats
  const [totalSessions, completedSessions, deviceStats] = await Promise.all([
    db.quizSession.count({ where }),
    db.quizSession.count({ where: { ...where, completedAt: { not: null } } }),
    db.quizSession.groupBy({
      by: ["deviceType"],
      where,
      _count: { id: true },
    }),
  ]);

  // Average duration (completed sessions only)
  const completedWithTimes = await db.quizSession.findMany({
    where: { ...where, completedAt: { not: null } },
    select: { startedAt: true, completedAt: true },
    take: 1000,
  });

  const durations = completedWithTimes
    .filter((s) => s.completedAt)
    .map((s) => (s.completedAt!.getTime() - s.startedAt.getTime()) / 1000);
  const avgDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;

  // Dropout analysis: at which question do users abandon?
  const dropouts = await db.quizSession.groupBy({
    by: ["abortedAtQ"],
    where: { ...where, abortedAtQ: { not: null } },
    _count: { id: true },
    orderBy: { abortedAtQ: "asc" },
  });

  // Top matched groups (from topMatches JSON field)
  const sessionsWithMatches = await db.quizSession.findMany({
    where: { ...where, topMatches: { not: Prisma.JsonNull } },
    select: { topMatches: true },
    take: 5000,
  });

  const groupMatchCounts: Record<string, { count: number; totalScore: number }> = {};
  for (const s of sessionsWithMatches) {
    const matches = s.topMatches as { groupId: string; score: number }[] | null;
    if (!matches) continue;
    // Count only the #1 match per session
    if (matches.length > 0) {
      const top = matches[0];
      if (!groupMatchCounts[top.groupId]) {
        groupMatchCounts[top.groupId] = { count: 0, totalScore: 0 };
      }
      groupMatchCounts[top.groupId].count++;
      groupMatchCounts[top.groupId].totalScore += top.score;
    }
  }

  const topGroups = Object.entries(groupMatchCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10)
    .map(([groupId, data]) => ({
      groupId,
      count: data.count,
      avgScore: Math.round(data.totalScore / data.count),
    }));

  // Resolve group names
  const groupIds = topGroups.map((g) => g.groupId);
  const groups = groupIds.length > 0
    ? await db.group.findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true },
      })
    : [];
  const groupNameMap = new Map(groups.map((g) => [g.id, g.name]));

  // Sessions per day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentSessions = await db.quizSession.findMany({
    where: { ...where, startedAt: { gte: thirtyDaysAgo } },
    select: { startedAt: true, completedAt: true },
  });

  const perDay: Record<string, { started: number; completed: number }> = {};
  for (const s of recentSessions) {
    const day = s.startedAt.toISOString().split("T")[0];
    if (!perDay[day]) perDay[day] = { started: 0, completed: 0 };
    perDay[day].started++;
    if (s.completedAt) perDay[day].completed++;
  }

  // Available semesters for filter
  const semesters = await db.quizSession.groupBy({
    by: ["semester"],
    _count: { id: true },
    orderBy: { semester: "desc" },
  });

  return NextResponse.json({
    overview: {
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 10000) / 100
        : 0,
      avgDurationSeconds: avgDuration,
      devices: deviceStats.map((d) => ({
        type: d.deviceType ?? "unknown",
        count: d._count.id,
      })),
    },
    dropouts: dropouts.map((d) => ({
      questionNumber: d.abortedAtQ,
      count: d._count.id,
    })),
    topGroups: topGroups.map((g) => ({
      ...g,
      name: groupNameMap.get(g.groupId) ?? "Unbekannte Gruppe",
    })),
    perDay: Object.entries(perDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts })),
    semesters: semesters.map((s) => ({
      tag: s.semester,
      count: s._count.id,
    })),
  });
}
