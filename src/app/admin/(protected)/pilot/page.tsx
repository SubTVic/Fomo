// SPDX-License-Identifier: AGPL-3.0-only

import Link from "next/link";
import { db } from "@/lib/db";
import { computePilotStatistics } from "@/app/api/admin/pilot/statistics/route";
import { PilotDashboardClient } from "./PilotDashboardClient";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

export default async function PilotDashboard() {
  const [stats, recentSessions, feedback] = await Promise.all([
    computePilotStatistics(),
    db.pilotSession.findMany({
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        variant: true,
        preferredVariant: true,
        semester: true,
        _count: { select: { answers: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    db.pilotSession.findMany({
      where: {
        completedAt: { not: null },
        OR: [
          { feedbackConfusing: { not: "" } },
          { feedbackMissing: { not: "" } },
        ],
      },
      select: {
        id: true,
        startedAt: true,
        variant: true,
        feedbackConfusing: true,
        feedbackMissing: true,
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
  ]);

  // Serialize dates for client component
  const serializedSessions = recentSessions.map((s) => ({
    id: s.id,
    startedAt: s.startedAt.toISOString(),
    completedAt: s.completedAt?.toISOString() ?? null,
    variant: s.variant,
    preferredVariant: s.preferredVariant,
    semester: s.semester,
    answerCount: s._count.answers,
  }));

  const serializedFeedback = feedback.map((s) => ({
    id: s.id,
    startedAt: s.startedAt.toISOString(),
    variant: s.variant,
    confusing: s.feedbackConfusing,
    missing: s.feedbackMissing,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="font-heading text-2xl uppercase">
          Pilot-Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pilot/dimensions"
            className="border-2 border-foreground px-4 py-2 text-sm font-heading uppercase hover:bg-foreground hover:text-primary-foreground transition-colors"
          >
            Fragen verwalten
          </Link>
          <ExportButton />
        </div>
      </div>

      <PilotDashboardClient
        stats={stats}
        recentSessions={serializedSessions}
        feedback={serializedFeedback}
      />
    </div>
  );
}
