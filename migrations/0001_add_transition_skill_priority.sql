ALTER TABLE IF EXISTS transition_skills
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';