// SPDX-License-Identifier: AGPL-3.0-only
// API: Generate invite tokens for groups (admin only)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const InviteSchema = z.object({
  groupId: z.string().min(1),
  email: z.string().email(),
  expiresInDays: z.number().int().min(1).max(90).default(30),
});

const BulkInviteSchema = z.object({
  invites: z.array(InviteSchema).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BulkInviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const results = [];

  for (const invite of parsed.data.invites) {
    const token = crypto.randomBytes(16).toString("hex"); // 32 chars
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + invite.expiresInDays);

    const created = await db.groupInvite.create({
      data: {
        token,
        groupId: invite.groupId,
        email: invite.email,
        expiresAt,
      },
    });

    // Set group registration status to "invited" if not already further along
    await db.group.update({
      where: { id: invite.groupId },
      data: {
        registrationStatus: "invited",
      },
    });

    results.push({
      groupId: invite.groupId,
      email: invite.email,
      token: created.token,
      expiresAt: created.expiresAt.toISOString(),
    });
  }

  return NextResponse.json({ success: true, invites: results });
}

// GET: List all invites (admin overview)
export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await db.groupInvite.findMany({
    include: {
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
