ALTER TABLE user_lessons_progress
ADD COLUMN IF NOT EXISTS last_position_seconds real DEFAULT 0 NOT NULL;
