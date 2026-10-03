// SPDX-License-Identifier: AGPL-3.0-only
// API: Generate edit links for groups in bulk (admin only).
// Since WP-4.2 these are reusable edit tokens (12 months, revocable), no longer
// one-time GroupInvite rows; old invite links keep working (see edit-token.ts).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, RegistrationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/require-admin";
import { createEditToken, editLink } from "@/lib/edit-token";

const InviteSchema = z.object({
  groupId: z.string().min(1),
  email: z.string().email().optional().nullable(),
  // Ignored since WP-4.2 (edit links are valid for 12 months); kept for old clients.
  expiresInDays: z.number().int().min(1).max(366).optional(),
});

const BulkInviteSchema = z.object({
  invites: z.array(InviteSchema).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

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

  for (const invite of parsed.data.invites) {
    let created;
    try {
      created = await createEditToken(db, invite.groupId);
    } catch (err) {
      // M5: catch foreign key violation (group doesn't exist)
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
        errors.push({ groupId: invite.groupId, error: "Group not found" });
        continue;
      }
      throw err;
    }

    // H1 fix: only advance to "invited" if not already submitted or verified
    await db.group.updateMany({
      where: {
        id: invite.groupId,
        registrationStatus: { notIn: [RegistrationStatus.SUBMITTED, RegistrationStatus.VERIFIED] },
      },
      data: { registrationStatus: RegistrationStatus.INVITED },
    });

    results.push({
      groupId: invite.groupId,
      email: invite.email,
      token: created.token,
      link: editLink(req.nextUrl.origin, created.token),
      expiresAt: created.expiresAt.toISOString(),
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
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const invites = await db.groupInvite.findMany({
    include: {
      group: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}
