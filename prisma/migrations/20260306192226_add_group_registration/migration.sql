-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "contactPersonRole" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "motto" TEXT,
ADD COLUMN     "onboardingInfo" TEXT,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "registeredVia" TEXT;

-- CreateTable
CREATE TABLE "group_pilot_answers" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "group_pilot_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_pilot_answers_groupId_idx" ON "group_pilot_answers"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "group_pilot_answers_groupId_questionId_key" ON "group_pilot_answers"("groupId", "questionId");

-- CreateIndex
CREATE INDEX "groups_registeredVia_idx" ON "groups"("registeredVia");

-- AddForeignKey
ALTER TABLE "group_pilot_answers" ADD CONSTRAINT "group_pilot_answers_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
