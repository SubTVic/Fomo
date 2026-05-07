/*
  Warnings:

  - The `registrationStatus` column on the `groups` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('INVITED', 'SUBMITTED', 'VERIFIED');

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "registrationStatus",
ADD COLUMN     "registrationStatus" "RegistrationStatus";

-- CreateTable
CREATE TABLE "study2_sessions" (
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
CREATE TABLE "study2_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "study2_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study2_sessions_groupId_idx" ON "study2_sessions"("groupId");

-- CreateIndex
CREATE INDEX "study2_sessions_completedAt_idx" ON "study2_sessions"("completedAt");

-- CreateIndex
CREATE INDEX "study2_answers_sessionId_idx" ON "study2_answers"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "study2_answers_sessionId_itemId_key" ON "study2_answers"("sessionId", "itemId");

-- CreateIndex
CREATE INDEX "groups_registrationStatus_idx" ON "groups"("registrationStatus");

-- AddForeignKey
ALTER TABLE "study2_sessions" ADD CONSTRAINT "study2_sessions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study2_answers" ADD CONSTRAINT "study2_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "study2_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
