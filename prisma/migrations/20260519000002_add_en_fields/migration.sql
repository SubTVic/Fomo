-- AlterTable: add English translation fields to QuizThesis
ALTER TABLE "quiz_theses" ADD COLUMN "textEn" TEXT;
ALTER TABLE "quiz_theses" ADD COLUMN "hintEn" VARCHAR(200);

-- AlterTable: add English translation fields to PilotDimension
ALTER TABLE "pilot_dimensions" ADD COLUMN "labelEn" TEXT;
ALTER TABLE "pilot_dimensions" ADD COLUMN "descriptionEn" TEXT;
