// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Escape a value for safe inclusion in a CSV cell.
 * Wraps in double quotes if the value contains a comma, quote, or newline.
 */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format =
    request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  const sessions = await db.pilotSession.findMany({
    include: { answers: true },
    orderBy: { startedAt: "desc" },
  });

  // --- JSON export ---
  if (format === "json") {
    return NextResponse.json({ total: sessions.length, sessions });
  }

  // --- CSV export ---
  const header = [
    "sessionId",
    "variant",
    "variantOrder",
    "preferredVariant",
    "preferenceReason",
    "semester",
    "isMember",
    "groupNames",
    "feedbackConfusing",
    "feedbackMissing",
    "startedAt",
    "completedAt",
    "durationMs",
    "questionId",
    "value",
  ];

  const rows: string[] = [header.join(",")];

  for (const s of sessions) {
    const durationMs =
      s.completedAt && s.startedAt
        ? String(s.completedAt.getTime() - s.startedAt.getTime())
        : "";

    const base = [
      s.id,
      s.variant,
      s.variantOrder ?? "",
      s.preferredVariant ?? "",
      s.preferenceReason ?? "",
      s.semester ?? "",
      s.isMember ?? "",
      s.groupNames ?? "",
      s.feedbackConfusing ?? "",
      s.feedbackMissing ?? "",
      s.startedAt.toISOString(),
      s.completedAt?.toISOString() ?? "",
      durationMs,
    ].map(csvEscape);

    if (s.answers.length === 0) {
      rows.push([...base, "", ""].join(","));
    } else {
      for (const a of s.answers) {
        rows.push(
          [...base, csvEscape(a.questionId), csvEscape(a.value)].join(","),
        );
      }
    }
  }

  const csv = rows.join("\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pilot-export-${today}.csv"`,
    },
  });
}
