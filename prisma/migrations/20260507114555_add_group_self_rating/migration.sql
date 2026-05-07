-- CreateTable
CREATE TABLE "group_self_ratings" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raterCount" INTEGER NOT NULL DEFAULT 1,
    "filterSelections" JSONB,

    CONSTRAINT "group_self_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_self_rating_answers" (
    "id" TEXT NOT NULL,
    "ratingId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "group_self_rating_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_self_ratings_groupId_key" ON "group_self_ratings"("groupId");

-- CreateIndex
CREATE INDEX "group_self_ratings_groupId_idx" ON "group_self_ratings"("groupId");

-- CreateIndex
CREATE INDEX "group_self_rating_answers_ratingId_idx" ON "group_self_rating_answers"("ratingId");

-- CreateIndex
CREATE UNIQUE INDEX "group_self_rating_answers_ratingId_itemId_key" ON "group_self_rating_answers"("ratingId", "itemId");

-- AddForeignKey
ALTER TABLE "group_self_ratings" ADD CONSTRAINT "group_self_ratings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_self_rating_answers" ADD CONSTRAINT "group_self_rating_answers_ratingId_fkey" FOREIGN KEY ("ratingId") REFERENCES "group_self_ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
