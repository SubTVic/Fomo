// SPDX-License-Identifier: AGPL-3.0-only
// API: export pilot survey data (protected by API key)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const EXPORT_KEY = process.env.PILOT_EXPORT_KEY;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!EXPORT_KEY) {
    return NextResponse.json(
      { error: "PILOT_EXPORT_KEY not configured" },
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${EXPORT_KEY}`) {
    return unauthorized();
  }

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 100, 500);
  const offset = Number(req.nextUrl.searchParams.get("offset")) || 0;

  const sessions = await db.pilotSession.findMany({
    include: { answers: true },
    orderBy: { startedAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await db.pilotSession.count();

  if (format === "csv") {
    const lines: string[] = [];
    lines.push(
      "sessionId,variant,variantOrder,preferredVariant,preferenceReason,semester,isMember,groupNames,feedbackConfusing,feedbackMissing,startedAt,completedAt,durationMs,questionId,value"
    );

    for (const s of sessions) {
      const duration = s.completedAt && s.startedAt
        ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
        : "";
      const base = [
        s.id,
        s.variant,
        s.variantOrder ?? "",
        s.preferredVariant ?? "",
        csvEscape(s.preferenceReason ?? ""),
        s.semester ?? "",
        s.isMember ?? "",
        csvEscape(s.groupNames ?? ""),
        csvEscape(s.feedbackConfusing ?? ""),
        csvEscape(s.feedbackMissing ?? ""),
        s.startedAt.toISOString(),
        s.completedAt?.toISOString() ?? "",
        String(duration),
      ];

      if (s.answers.length === 0) {
        lines.push([...base, "", ""].join(","));
      } else {
        for (const a of s.answers) {
          lines.push([...base, a.questionId, a.value].join(","));
        }
      }
    }

    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pilot-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ total, limit, offset, sessions });
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
