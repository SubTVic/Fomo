-- CreateTable
CREATE TABLE "group_change_logs" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByEmail" TEXT,

    CONSTRAINT "group_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_change_logs_groupId_idx" ON "group_change_logs"("groupId");

-- CreateIndex
CREATE INDEX "group_change_logs_reviewedAt_idx" ON "group_change_logs"("reviewedAt");

-- AddForeignKey
ALTER TABLE "group_change_logs" ADD CONSTRAINT "group_change_logs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
