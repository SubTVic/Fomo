-- CreateIndex
CREATE UNIQUE INDEX "pilot_answers_sessionId_questionId_key" ON "pilot_answers"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "pilot_sessions_completedAt_idx" ON "pilot_sessions"("completedAt");
