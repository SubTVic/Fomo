-- Remove unused Question/QuestionOption/GroupProfile tables.
-- These were a legacy design that was replaced by QuizThesis/QuizThesisAttribute.
-- No application code reads from these tables; only seed.ts created test data.

DROP TABLE IF EXISTS "group_profiles";
DROP TABLE IF EXISTS "question_options";
DROP TABLE IF EXISTS "questions";
DROP TYPE IF EXISTS "QuestionType";
