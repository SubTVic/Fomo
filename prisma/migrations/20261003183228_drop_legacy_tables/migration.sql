/*
  Warnings:

  - You are about to drop the column `confirmedAttributes` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `scraperAttributes` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the `group_pilot_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pilot_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pilot_dimensions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pilot_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pilot_survey_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_theses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quiz_thesis_attributes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `site_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study2_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `study2_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_pilot_answers" DROP CONSTRAINT "group_pilot_answers_groupId_fkey";

-- DropForeignKey
ALTER TABLE "pilot_answers" DROP CONSTRAINT "pilot_answers_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "pilot_survey_questions" DROP CONSTRAINT "pilot_survey_questions_dimensionId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_thesis_attributes" DROP CONSTRAINT "quiz_thesis_attributes_thesisId_fkey";

-- DropForeignKey
ALTER TABLE "study2_answers" DROP CONSTRAINT "study2_answers_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "study2_sessions" DROP CONSTRAINT "study2_sessions_groupId_fkey";

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "confirmedAttributes",
DROP COLUMN "scraperAttributes";

-- DropTable
DROP TABLE "group_pilot_answers";

-- DropTable
DROP TABLE "pilot_answers";

-- DropTable
DROP TABLE "pilot_dimensions";

-- DropTable
DROP TABLE "pilot_sessions";

-- DropTable
DROP TABLE "pilot_survey_questions";

-- DropTable
DROP TABLE "quiz_sessions";

-- DropTable
DROP TABLE "quiz_theses";

-- DropTable
DROP TABLE "quiz_thesis_attributes";

-- DropTable
DROP TABLE "site_config";

-- DropTable
DROP TABLE "study2_answers";

-- DropTable
DROP TABLE "study2_sessions";
