// SPDX-License-Identifier: AGPL-3.0-only
// API: Full database export (admin only) — downloads JSON snapshot of all tables.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    categories,
    groups,
    groupPilotAnswers,
    groupInvites,
    groupContacts,
    groupSelfRatings,
    groupSelfRatingAnswers,
    admins,
    siteConfig,
    quizSessions,
    quizTheses,
    quizThesisAttributes,
    pilotDimensions,
    pilotSurveyQuestions,
    pilotSessions,
    pilotAnswers,
    study2Sessions,
    study2Answers,
  ] = await Promise.all([
    db.category.findMany(),
    db.group.findMany(),
    db.groupPilotAnswer.findMany(),
    db.groupInvite.findMany(),
    db.groupContact.findMany(),
    db.groupSelfRating.findMany(),
    db.groupSelfRatingAnswer.findMany(),
    db.admin.findMany({
      // omit password hashes from backup for safety
      select: {
        id: true,
        email: true,
        name: true,
        ssoId: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.siteConfig.findMany(),
    db.quizSession.findMany(),
    db.quizThesis.findMany(),
    db.quizThesisAttribute.findMany(),
    db.pilotDimension.findMany(),
    db.pilotSurveyQuestion.findMany(),
    db.pilotSession.findMany(),
    db.pilotAnswer.findMany(),
    db.study2Session.findMany(),
    db.study2Answer.findMany(),
  ]);

  const snapshot = {
    meta: {
      exportedAt: new Date().toISOString(),
      version: 1,
      note: "Admin password hashes are intentionally omitted.",
    },
    categories,
    groups,
    groupPilotAnswers,
    groupInvites,
    groupContacts,
    groupSelfRatings,
    groupSelfRatingAnswers,
    admins,
    siteConfig,
    quizSessions,
    quizTheses,
    quizThesisAttributes,
    pilotDimensions,
    pilotSurveyQuestions,
    pilotSessions,
    pilotAnswers,
    study2Sessions,
    study2Answers,
  };

  const filename = `fomo-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;

  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
