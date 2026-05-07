// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const format = request.nextUrl.searchParams.get("format") === "csv" ? "csv" : "json";

  const sessions = await db.study2Session.findMany({
    include: {
      answers: true,
      group: { select: { id: true, name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  if (format === "json") {
    return NextResponse.json({ total: sessions.length, sessions });
  }

  const header = [
    "sessionId",
    "groupId",
    "groupName",
    "groupNameFreeText",
    "filterSelections",
    "semester",
    "studyField",
    "isMember",
    "feedbackConfusing",
    "feedbackMissing",
    "startedAt",
    "completedAt",
    "durationMs",
    "itemId",
    "value",
  ];
  const rows: string[] = [header.join(",")];

  for (const s of sessions) {
    const durationMs =
      s.completedAt && s.startedAt
        ? String(s.completedAt.getTime() - s.startedAt.getTime())
        : "";
    const filterStr = Array.isArray(s.filterSelections)
      ? (s.filterSelections as string[]).join("|")
      : "";

    const base = [
      s.id,
      s.groupId ?? "",
      s.group?.name ?? "",
      s.groupNameFreeText ?? "",
      filterStr,
      s.semester ?? "",
      s.studyField ?? "",
      s.isMember ?? "",
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
        rows.push([...base, csvEscape(a.itemId), csvEscape(String(a.value))].join(","));
      }
    }
  }

  const csv = rows.join("\n");
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="study2-export-${today}.csv"`,
      "X-Total-Count": String(sessions.length),
    },
  });
}
