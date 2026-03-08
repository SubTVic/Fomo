-- AlterTable
ALTER TABLE "pilot_survey_questions" ADD COLUMN     "isInverse" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "dimensionId" DROP NOT NULL;
