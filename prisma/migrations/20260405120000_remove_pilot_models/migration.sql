-- Remove pilot study tables (data exported to pilot-archive/pilot-data-export.sql.gz)

-- Drop dependent tables first (foreign keys)
DROP TABLE IF EXISTS "pilot_answers";
DROP TABLE IF EXISTS "pilot_sessions";
DROP TABLE IF EXISTS "pilot_survey_questions";
DROP TABLE IF EXISTS "pilot_dimensions";
DROP TABLE IF EXISTS "group_pilot_answers";
