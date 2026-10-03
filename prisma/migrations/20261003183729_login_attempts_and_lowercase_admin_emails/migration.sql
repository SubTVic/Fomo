-- Admin logins compare lower-case e-mail addresses from now on (WP-5.4).
-- Runs first: if two admins differ only in letter case, this fails before
-- anything else changes; merge or rename one of them, then retry.
UPDATE "admins" SET "email" = lower(trim("email")) WHERE "email" <> lower(trim("email"));

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_attempts_emailHash_createdAt_idx" ON "login_attempts"("emailHash", "createdAt");
