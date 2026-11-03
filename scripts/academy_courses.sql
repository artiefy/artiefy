-- Cursos de las academias y sus catálogos. TODO en tablas aparte de las de
-- Artiefy (courses, categories, modalidades, nivel, schedule_options,
-- space_options, certification_types): lo de una academia nunca aparece en
-- Artiefy ni en otra academia. Cada catálogo es propio de su academia.
--
-- Reversible con (en este orden):
--   DROP TABLE academy_courses;
--   DROP TABLE academy_tipos_certificacion, academy_espacios, academy_horarios,
--              academy_niveles, academy_modalidades, academy_categorias;

-- Catálogos (misma forma: id, academia, nombre, descripción).
CREATE TABLE IF NOT EXISTS academy_categorias (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_categorias_unico UNIQUE (academy_id, name)
);
CREATE TABLE IF NOT EXISTS academy_modalidades (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_modalidades_unico UNIQUE (academy_id, name)
);
CREATE TABLE IF NOT EXISTS academy_niveles (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_niveles_unico UNIQUE (academy_id, name)
);
CREATE TABLE IF NOT EXISTS academy_horarios (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_horarios_unico UNIQUE (academy_id, name)
);
CREATE TABLE IF NOT EXISTS academy_espacios (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_espacios_unico UNIQUE (academy_id, name)
);
CREATE TABLE IF NOT EXISTS academy_tipos_certificacion (
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_tipos_certificacion_unico UNIQUE (academy_id, name)
);

-- Cursos: misma estructura que courses (se reutilizan la pantalla y el modal
-- de cursos de Artiefy) más academy_id; los catálogos son los de la academia.
-- El instructor es una cuenta de academy_users (id de Clerk).
CREATE TABLE IF NOT EXISTS academy_courses (
  id                     serial PRIMARY KEY,
  academy_id             integer      NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  title                  varchar(255) NOT NULL,
  subtitle               varchar(255),
  description            text,
  cover_image_key        text,
  cover_video_course_key text,
  categoria_id           integer      NOT NULL REFERENCES academy_categorias(id),
  modalidad_id           integer      NOT NULL REFERENCES academy_modalidades(id),
  nivel_id               integer      NOT NULL REFERENCES academy_niveles(id),
  horario_id             integer      REFERENCES academy_horarios(id) ON DELETE SET NULL,
  espacio_id             integer      REFERENCES academy_espacios(id) ON DELETE SET NULL,
  tipo_certificacion_id  integer      REFERENCES academy_tipos_certificacion(id) ON DELETE SET NULL,
  instructor             text,
  creator_id             text         NOT NULL,
  individual_price       integer,
  is_active              boolean      NOT NULL DEFAULT true,
  visibility             boolean      NOT NULL DEFAULT true,
  created_at             timestamptz  NOT NULL DEFAULT now(),
  updated_at             timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_courses_academy_idx
  ON academy_courses (academy_id);
