CREATE TABLE IF NOT EXISTS project_shares (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_share
  ON project_shares(project_id, user_id);

CREATE INDEX IF NOT EXISTS project_shares_project_idx
  ON project_shares(project_id);

CREATE INDEX IF NOT EXISTS project_shares_user_idx
  ON project_shares(user_id);
