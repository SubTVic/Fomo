// SPDX-License-Identifier: AGPL-3.0-only

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isRateLimited, getClientKey } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const clientKey = getClientKey(request.headers);
  if (isRateLimited(`health:${clientKey}`, 60, 60_000)) {
    return NextResponse.json(
      { status: "error", message: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
