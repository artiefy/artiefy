-- Agregar campo numberOfActivities a tabla parametros
ALTER TABLE parametros ADD COLUMN number_of_activities INTEGER DEFAULT 0 NOT NULL;

-- Crear tabla parameter_templates
CREATE TABLE parameter_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_percentage INTEGER NOT NULL DEFAULT 0,
  course_id INTEGER NOT NULL,
  creator_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY(course_id) REFERENCES "courses"(id),
  FOREIGN KEY(creator_id) REFERENCES "users"(id)
);

-- Crear tabla template_parametros
CREATE TABLE template_parametros (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL,
  parametro_id INTEGER NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(template_id) REFERENCES parameter_templates(id) ON DELETE CASCADE,
  FOREIGN KEY(parametro_id) REFERENCES parametros(id) ON DELETE CASCADE
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_parameter_templates_course_id ON parameter_templates(course_id);
CREATE INDEX idx_parameter_templates_creator_id ON parameter_templates(creator_id);
CREATE INDEX idx_template_parametros_template_id ON template_parametros(template_id);
CREATE INDEX idx_template_parametros_parametro_id ON template_parametros(parametro_id);
