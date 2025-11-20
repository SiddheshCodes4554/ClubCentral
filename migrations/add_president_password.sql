-- Add president_password column to clubs table for admin viewing
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS president_password text;

