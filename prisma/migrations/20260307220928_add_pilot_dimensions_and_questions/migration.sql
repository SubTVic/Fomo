-- CreateTable
CREATE TABLE "pilot_dimensions" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "blockIndex" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pilot_survey_questions" (
    "id" TEXT NOT NULL,
    "dimensionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pilot_survey_questions_dimensionId_idx" ON "pilot_survey_questions"("dimensionId");

-- AddForeignKey
ALTER TABLE "pilot_survey_questions" ADD CONSTRAINT "pilot_survey_questions_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "pilot_dimensions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
