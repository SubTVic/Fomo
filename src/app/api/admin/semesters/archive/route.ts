// SPDX-License-Identifier: AGPL-3.0-only
// API: Archive current semester and start a new one

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { RegistrationStatus } from "@prisma/client";
import { z } from "zod";

const ArchiveSchema = z.object({
  newSemesterTag: z.string().min(1).max(20), // e.g. "WS27/28"
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only SUPER_ADMIN can archive semesters
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ArchiveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { newSemesterTag } = parsed.data;

  // Get current semester tag
  const currentConfig = await db.siteConfig.findUnique({
    where: { key: "current_semester" },
  });
  const currentTag = currentConfig?.value ?? "Unbekannt";

  // Check for duplicate
  const existing = await db.semesterArchive.findUnique({ where: { tag: currentTag } });
  if (existing) {
    return NextResponse.json(
      { error: `Semester "${currentTag}" wurde bereits archiviert.` },
      { status: 409 },
    );
  }

  // Gather statistics
  const [theses, sessionStats, groupCount] = await Promise.all([
    db.quizThesis.findMany({
      where: { isActive: true },
      include: { attributes: true },
    }),
    db.quizSession.aggregate({
      where: { semester: currentTag },
      _count: { id: true },
      _avg: { questionCount: true },
    }),
    db.group.count({ where: { isActive: true } }),
  ]);

  const completedCount = await db.quizSession.count({
    where: { semester: currentTag, completedAt: { not: null } },
  });

  const totalSessions = sessionStats._count.id;
  const completionRate = totalSessions > 0 ? completedCount / totalSessions : 0;

  // Create archive entry
  const archive = await db.semesterArchive.create({
    data: {
      tag: currentTag,
      startDate: new Date(), // Approximation — ideally tracked from semester start
      endDate: new Date(),
      thesisSnapshot: theses.map((t) => ({
        id: t.id,
        text: t.text,
        shortTitle: t.shortTitle,
        hint: t.hint,
        attributes: t.attributes.map((a) => ({
          attribute: a.attribute,
          isInverse: a.isInverse,
        })),
      })),
      statistics: {
        totalSessions,
        completedSessions: completedCount,
        avgQuestionCount: sessionStats._avg.questionCount ?? 0,
      },
      groupCount,
      sessionCount: totalSessions,
      completionRate: Math.round(completionRate * 10000) / 10000,
    },
  });

  // Update current semester tag
  await db.siteConfig.upsert({
    where: { key: "current_semester" },
    update: { value: newSemesterTag },
    create: { key: "current_semester", value: newSemesterTag },
  });

  // Reset group registration status for the new semester
  await db.group.updateMany({
    where: { isActive: true, registrationStatus: RegistrationStatus.VERIFIED },
    data: { registrationStatus: RegistrationStatus.INVITED },
  });

  return NextResponse.json({
    ok: true,
    archive: { id: archive.id, tag: archive.tag },
    newSemester: newSemesterTag,
  });
}

// GET: List all archived semesters
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archives = await db.semesterArchive.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Get current semester
  const current = await db.siteConfig.findUnique({
    where: { key: "current_semester" },
  });

  return NextResponse.json({
    currentSemester: current?.value ?? null,
    archives,
  });
}
