// SPDX-License-Identifier: AGPL-3.0-only

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setSiteConfigBulk } from "@/lib/queries/site-config";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Filter to only string key-value pairs
  const entries: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof key === "string" && typeof value === "string") {
      entries[key] = value;
    }
  }

  await setSiteConfigBulk(entries);
  return NextResponse.json({ ok: true });
}
