-- CreateTable
CREATE TABLE "group_edit_tokens" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_edit_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_edit_tokens_tokenHash_key" ON "group_edit_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "group_edit_tokens_groupId_idx" ON "group_edit_tokens"("groupId");

-- AddForeignKey
ALTER TABLE "group_edit_tokens" ADD CONSTRAINT "group_edit_tokens_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
