-- AlterTable
ALTER TABLE "quiz_sessions" ADD COLUMN     "abortedAtQ" INTEGER,
ADD COLUMN     "answers" JSONB,
ADD COLUMN     "deviceType" TEXT,
ADD COLUMN     "semester" TEXT,
ADD COLUMN     "topMatches" JSONB;

-- CreateTable
CREATE TABLE "semester_archives" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "thesisSnapshot" JSONB NOT NULL,
    "statistics" JSONB NOT NULL,
    "groupCount" INTEGER NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "semester_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_thesis_versions" (
    "id" TEXT NOT NULL,
    "thesisId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "hint" VARCHAR(200),
    "attributeMappings" JSONB NOT NULL,
    "semesterTag" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_thesis_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "semester_archives_tag_key" ON "semester_archives"("tag");

-- CreateIndex
CREATE INDEX "quiz_thesis_versions_thesisId_idx" ON "quiz_thesis_versions"("thesisId");

-- CreateIndex
CREATE INDEX "quiz_sessions_semester_idx" ON "quiz_sessions"("semester");

-- AddForeignKey
ALTER TABLE "quiz_thesis_versions" ADD CONSTRAINT "quiz_thesis_versions_thesisId_fkey" FOREIGN KEY ("thesisId") REFERENCES "quiz_theses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
