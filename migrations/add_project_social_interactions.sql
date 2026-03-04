-- Tabla de likes de proyectos
CREATE TABLE IF NOT EXISTS project_likes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_like
  ON project_likes(project_id, user_id);

CREATE INDEX IF NOT EXISTS project_likes_project_idx
  ON project_likes(project_id);

CREATE INDEX IF NOT EXISTS project_likes_user_idx
  ON project_likes(user_id);

-- Tabla de guardados de proyectos
CREATE TABLE IF NOT EXISTS project_saves (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_project_save
  ON project_saves(project_id, user_id);

CREATE INDEX IF NOT EXISTS project_saves_project_idx
  ON project_saves(project_id);

CREATE INDEX IF NOT EXISTS project_saves_user_idx
  ON project_saves(user_id);

-- Tabla de comentarios de proyectos
CREATE TABLE IF NOT EXISTS project_comments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_comments_project_idx
  ON project_comments(project_id);

CREATE INDEX IF NOT EXISTS project_comments_user_idx
  ON project_comments(user_id);
