-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('INVITED', 'SUBMITTED', 'VERIFIED');

-- Convert existing string values to enum
UPDATE "groups" SET "registrationStatus" = NULL WHERE "registrationStatus" NOT IN ('invited', 'submitted', 'verified');

-- Alter column: first drop old, create new
ALTER TABLE "groups" RENAME COLUMN "registrationStatus" TO "registrationStatus_old";
ALTER TABLE "groups" ADD COLUMN "registrationStatus" "RegistrationStatus";
UPDATE "groups" SET "registrationStatus" = 'INVITED' WHERE "registrationStatus_old" = 'invited';
UPDATE "groups" SET "registrationStatus" = 'SUBMITTED' WHERE "registrationStatus_old" = 'submitted';
UPDATE "groups" SET "registrationStatus" = 'VERIFIED' WHERE "registrationStatus_old" = 'verified';
ALTER TABLE "groups" DROP COLUMN "registrationStatus_old";

-- Drop old string index, create new enum index
DROP INDEX IF EXISTS "groups_registrationStatus_idx";
CREATE INDEX "groups_registrationStatus_idx" ON "groups"("registrationStatus");

-- Add missing indexes on QuizSession
CREATE INDEX IF NOT EXISTS "quiz_sessions_completedAt_idx" ON "quiz_sessions"("completedAt");
CREATE INDEX IF NOT EXISTS "quiz_sessions_startedAt_idx" ON "quiz_sessions"("startedAt");
