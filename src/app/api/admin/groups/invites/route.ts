// SPDX-License-Identifier: AGPL-3.0-only
// API: Generate invite tokens for groups (admin only)

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, RegistrationStatus } from "@prisma/client";
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
  const errors: { groupId: string; error: string }[] = [];

  // Prepare all invite data upfront to batch DB operations
  const inviteData = parsed.data.invites.map((invite) => {
    const token = crypto.randomBytes(16).toString("hex"); // 32 chars
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + invite.expiresInDays);
    return { ...invite, token, expiresAt };
  });

  // Create invites individually (needed for FK error handling per invite)
  for (const invite of inviteData) {
    try {
      await db.groupInvite.create({
        data: {
          token: invite.token,
          groupId: invite.groupId,
          email: invite.email,
          expiresAt: invite.expiresAt,
        },
      });
      results.push({
        groupId: invite.groupId,
        email: invite.email,
        token: invite.token,
        expiresAt: invite.expiresAt.toISOString(),
      });
    } catch (err) {
      // M5: catch foreign key violation (group doesn't exist)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        errors.push({ groupId: invite.groupId, error: "Group not found" });
        continue;
      }
      throw err;
    }
  }

  // H1 fix: batch-update registration status — only advance to "invited"
  // if not already submitted or verified. Single query instead of N queries.
  const successGroupIds = results.map((r) => r.groupId);
  if (successGroupIds.length > 0) {
    await db.group.updateMany({
      where: {
        id: { in: successGroupIds },
        registrationStatus: { notIn: [RegistrationStatus.SUBMITTED, RegistrationStatus.VERIFIED] },
      },
      data: { registrationStatus: RegistrationStatus.INVITED },
    });
  }

  return NextResponse.json({
    success: true,
    invites: results,
    ...(errors.length > 0 && { errors }),
  });
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
