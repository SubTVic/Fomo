/*
  Warnings:

  - The `registrationStatus` column on the `groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "RegistrationStatus" AS ENUM ('INVITED', 'SUBMITTED', 'VERIFIED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- AlterTable (idempotent)
ALTER TABLE "groups" DROP COLUMN IF EXISTS "registrationStatus";
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "registrationStatus" "RegistrationStatus";

-- CreateTable
CREATE TABLE IF NOT EXISTS "study2_sessions" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "groupId" TEXT,
    "groupNameFreeText" TEXT,
    "filterSelections" JSONB,
    "semester" TEXT,
    "studyField" TEXT,
    "isMember" TEXT DEFAULT 'yes',
    "feedbackConfusing" TEXT,
    "feedbackMissing" TEXT,

    CONSTRAINT "study2_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "study2_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "study2_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study2_sessions_groupId_idx" ON "study2_sessions"("groupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study2_sessions_completedAt_idx" ON "study2_sessions"("completedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study2_answers_sessionId_idx" ON "study2_answers"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "study2_answers_sessionId_itemId_key" ON "study2_answers"("sessionId", "itemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "groups_registrationStatus_idx" ON "groups"("registrationStatus");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "study2_sessions" ADD CONSTRAINT "study2_sessions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "study2_answers" ADD CONSTRAINT "study2_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study2_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
