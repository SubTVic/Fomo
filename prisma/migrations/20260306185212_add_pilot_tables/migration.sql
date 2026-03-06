-- CreateTable
CREATE TABLE "pilot_sessions" (
    "id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "semester" TEXT,
    "isMember" TEXT,
    "groupNames" TEXT,
    "feedbackConfusing" TEXT,
    "feedbackMissing" TEXT,

    CONSTRAINT "pilot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_answers" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "pilot_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilot_sessions_variant_idx" ON "pilot_sessions"("variant");

-- CreateIndex
CREATE INDEX "pilot_answers_sessionId_idx" ON "pilot_answers"("sessionId");

-- AddForeignKey
ALTER TABLE "pilot_answers" ADD CONSTRAINT "pilot_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "pilot_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
