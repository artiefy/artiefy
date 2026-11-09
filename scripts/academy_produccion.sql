-- =============================================================================
-- ACADEMIAS — ESTRUCTURA PARA PRODUCCIÓN (sin datos de ejemplo)
-- =============================================================================
-- Crea (si no existen) todas las tablas, columnas e índices de las academias:
-- cuentas, catálogos, cursos, clases, actividades, notas, matrículas,
-- programas, grupos, pagos, proyectos, inscripciones, tickets, logs, roles
-- secundarios, varios instructores, parámetros de evaluación, etc.
--
-- Es UNA sola sentencia (DO $$ … $$): se puede pegar en el editor SQL de
-- Neon, en Drizzle Studio o correr con psql. Corre en una transacción y se
-- puede correr varias veces (todo es IF NOT EXISTS). NO crea academias ni
-- usuarios: la academia (p. ej. PONAO) se crea luego desde
-- Artiefy › Academias.
--
-- Generado a partir de academy_seed_completo.sql (parte 1) y
-- academy_cursos_detalle.sql.
-- =============================================================================

DO $$
BEGIN
  -- -----------------------------------------------------------------------------
  -- 1. ESTRUCTURA
  -- -----------------------------------------------------------------------------

  CREATE TABLE IF NOT EXISTS academies (
    id               serial PRIMARY KEY,
    slug             text        NOT NULL UNIQUE,
    nombre           text        NOT NULL,
    acronimo         text,
    tipo             text        NOT NULL DEFAULT 'personal'
                     CHECK (tipo IN ('personal', 'empresa')),
    documento_tipo   text,
    documento_numero text,
    es_artiefy       boolean     NOT NULL DEFAULT false,
    logo_key         text,
    color_primario   text        NOT NULL DEFAULT '#22C4D3',
    color_fondo      text        NOT NULL DEFAULT '#01142B',
    activa           boolean     NOT NULL DEFAULT true,
    created_by       text,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academies_slug_formato
      CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$')
  );

  CREATE TABLE IF NOT EXISTS academy_users (
    id            serial PRIMARY KEY,
    academy_id    integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id       text        NOT NULL,
    email         text        NOT NULL,
    name          text,
    role          text        NOT NULL
                  CHECK (role IN ('super-admin', 'educador', 'estudiante')),
    cuenta_propia boolean     NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_users_email_unico UNIQUE (academy_id, email),
    CONSTRAINT academy_users_cuenta_unica UNIQUE (academy_id, user_id)
  );
  ALTER TABLE academy_users
    ADD COLUMN IF NOT EXISTS cuenta_propia boolean NOT NULL DEFAULT true;
  ALTER TABLE academy_users
    ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
  -- Una cuenta (de Artiefy) puede estar en varias academias: se quita la
  -- restricción vieja (user_id único) y se asegura la de (academia, cuenta).
  ALTER TABLE academy_users DROP CONSTRAINT IF EXISTS academy_users_user_id_key;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'academy_users_cuenta_unica'
  ) THEN
    ALTER TABLE academy_users
      ADD CONSTRAINT academy_users_cuenta_unica UNIQUE (academy_id, user_id);
  END IF;
  CREATE INDEX IF NOT EXISTS academy_users_user_idx ON academy_users (user_id);
  CREATE INDEX IF NOT EXISTS academy_users_academy_idx ON academy_users (academy_id);

  -- Catálogos de cada academia.
  CREATE TABLE IF NOT EXISTS academy_categorias (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name text NOT NULL, description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_categorias_unico UNIQUE (academy_id, name)
  );
  CREATE TABLE IF NOT EXISTS academy_modalidades (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name text NOT NULL, description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_modalidades_unico UNIQUE (academy_id, name)
  );
  CREATE TABLE IF NOT EXISTS academy_niveles (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name text NOT NULL, description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_niveles_unico UNIQUE (academy_id, name)
  );
  CREATE TABLE IF NOT EXISTS academy_horarios (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name text NOT NULL, description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_horarios_unico UNIQUE (academy_id, name)
  );
  CREATE TABLE IF NOT EXISTS academy_espacios (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name text NOT NULL, description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_espacios_unico UNIQUE (academy_id, name)
  );
  CREATE TABLE IF NOT EXISTS academy_tipos_certificacion (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    name text NOT NULL, description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_tipos_certificacion_unico UNIQUE (academy_id, name)
  );

  -- Cursos.
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
  CREATE INDEX IF NOT EXISTS academy_courses_academy_idx ON academy_courses (academy_id);

  -- Lecciones de cada curso (NUEVA).
  CREATE TABLE IF NOT EXISTS academy_lessons (
    id            serial PRIMARY KEY,
    academy_id    integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    course_id     integer     NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    title         text        NOT NULL,
    description   text,
    orden         integer     NOT NULL DEFAULT 1,
    video_url     text,
    duracion_min  integer,
    created_at    timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_lessons_course_idx ON academy_lessons (course_id, orden);

  -- Clases (sesiones en vivo o presenciales) de cada curso (NUEVA).
  CREATE TABLE IF NOT EXISTS academy_clases (
    id          serial PRIMARY KEY,
    academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    course_id   integer     NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    lesson_id   integer     REFERENCES academy_lessons(id) ON DELETE SET NULL,
    titulo      text        NOT NULL,
    inicio      timestamptz NOT NULL,
    fin         timestamptz NOT NULL,
    enlace      text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_clases_rango CHECK (fin > inicio)
  );
  CREATE INDEX IF NOT EXISTS academy_clases_course_idx ON academy_clases (course_id, inicio);

  -- Actividades de cada lección (NUEVA).
  CREATE TABLE IF NOT EXISTS academy_activities (
    id            serial PRIMARY KEY,
    academy_id    integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    lesson_id     integer     NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
    title         text        NOT NULL,
    description   text,
    tipo          text        NOT NULL DEFAULT 'tarea'
                  CHECK (tipo IN ('tarea', 'quiz', 'proyecto')),
    fecha_limite  timestamptz,
    puntaje       integer     NOT NULL DEFAULT 100,
    created_at    timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_activities_lesson_idx ON academy_activities (lesson_id);

  -- Notas de los estudiantes en las actividades (NUEVA): puntos obtenidos sobre
  -- el puntaje de la actividad.
  CREATE TABLE IF NOT EXISTS academy_activity_grades (
    id           serial PRIMARY KEY,
    academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    activity_id  integer     NOT NULL REFERENCES academy_activities(id) ON DELETE CASCADE,
    user_id      text        NOT NULL,
    nota         real        NOT NULL CHECK (nota >= 0),
    comentario   text,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_activity_grades_unica UNIQUE (activity_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS academy_activity_grades_user_idx
    ON academy_activity_grades (academy_id, user_id);

  -- Matrículas.
  CREATE TABLE IF NOT EXISTS academy_enrollments (
    id           serial PRIMARY KEY,
    academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    course_id    integer     NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    user_id      text        NOT NULL,
    completed    boolean     NOT NULL DEFAULT false,
    enrolled_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_enrollments_unica UNIQUE (course_id, user_id)
  );
  CREATE INDEX IF NOT EXISTS academy_enrollments_academy_user_idx
    ON academy_enrollments (academy_id, user_id);

  -- Programas.
  CREATE TABLE IF NOT EXISTS academy_programas (
    id           serial PRIMARY KEY,
    academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    title        text        NOT NULL,
    description  text,
    is_active    boolean     NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_programas_academy_idx ON academy_programas (academy_id);
  CREATE TABLE IF NOT EXISTS academy_programa_cursos (
    id           serial PRIMARY KEY,
    programa_id  integer NOT NULL REFERENCES academy_programas(id) ON DELETE CASCADE,
    course_id    integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    CONSTRAINT academy_programa_cursos_unico UNIQUE (programa_id, course_id)
  );

  -- Grupos.
  CREATE TABLE IF NOT EXISTS academy_grupos (
    id          serial PRIMARY KEY,
    academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    nombre      text        NOT NULL,
    course_id   integer     REFERENCES academy_courses(id) ON DELETE SET NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_grupos_academy_idx ON academy_grupos (academy_id);
  CREATE TABLE IF NOT EXISTS academy_grupo_estudiantes (
    id        serial PRIMARY KEY,
    grupo_id  integer NOT NULL REFERENCES academy_grupos(id) ON DELETE CASCADE,
    user_id   text    NOT NULL,
    CONSTRAINT academy_grupo_estudiantes_unico UNIQUE (grupo_id, user_id)
  );

  -- Finanzas.
  CREATE TABLE IF NOT EXISTS academy_pagos (
    id          serial PRIMARY KEY,
    academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    user_id     text        NOT NULL,
    concepto    text        NOT NULL,
    monto       integer     NOT NULL CHECK (monto >= 0),
    fecha       date        NOT NULL,
    metodo      text,
    estado      text        NOT NULL DEFAULT 'pagado'
      CHECK (estado IN ('pagado', 'pendiente', 'anulado')),
    created_by  text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_pagos_academy_idx ON academy_pagos (academy_id, user_id);

  -- Proyectos de estudiantes.
  CREATE TABLE IF NOT EXISTS academy_proyectos (
    id           serial PRIMARY KEY,
    academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    course_id    integer     NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    user_id      text        NOT NULL,
    titulo       text        NOT NULL,
    descripcion  text,
    enlace       text,
    estado       text        NOT NULL DEFAULT 'en progreso'
      CHECK (estado IN ('en progreso', 'entregado', 'aprobado')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_proyectos_academy_idx ON academy_proyectos (academy_id);

  -- Formulario de inscripción.
  CREATE TABLE IF NOT EXISTS academy_inscripciones (
    id          serial PRIMARY KEY,
    academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    nombre      text        NOT NULL,
    email       text        NOT NULL,
    telefono    text,
    documento   text,
    course_id   integer     REFERENCES academy_courses(id) ON DELETE SET NULL,
    mensaje     text,
    estado      text        NOT NULL DEFAULT 'nueva'
      CHECK (estado IN ('nueva', 'contactada', 'inscrita', 'descartada')),
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_inscripciones_academy_idx ON academy_inscripciones (academy_id);

  -- Tickets hacia el soporte de Artiefy.
  CREATE TABLE IF NOT EXISTS academy_tickets (
    id           serial PRIMARY KEY,
    academy_id   integer      NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    creator_id   text         NOT NULL,
    email        text         NOT NULL,
    title        varchar(120) NOT NULL,
    description  text         NOT NULL,
    tipo         text         NOT NULL DEFAULT 'soporte'
      CHECK (tipo IN ('soporte', 'bug', 'revision', 'otro')),
    estado       text         NOT NULL DEFAULT 'abierto'
      CHECK (estado IN ('abierto', 'en proceso', 'en revision', 'solucionado', 'cerrado')),
    created_at   timestamptz  NOT NULL DEFAULT now(),
    updated_at   timestamptz  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_tickets_academy_idx ON academy_tickets (academy_id);
  CREATE TABLE IF NOT EXISTS academy_ticket_comments (
    id          serial PRIMARY KEY,
    ticket_id   integer     NOT NULL REFERENCES academy_tickets(id) ON DELETE CASCADE,
    user_id     text        NOT NULL,
    sender      text        NOT NULL CHECK (sender IN ('academia', 'artiefy')),
    content     text        NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_ticket_comments_ticket_idx ON academy_ticket_comments (ticket_id);

  -- Logs.
  CREATE TABLE IF NOT EXISTS academy_logs (
    id           serial PRIMARY KEY,
    academy_id   integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    actor_id     text,
    actor_email  text,
    accion       text        NOT NULL,
    detalle      text,
    created_at   timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS academy_logs_academy_idx ON academy_logs (academy_id, created_at);

  -- Roles secundarios.
  CREATE TABLE IF NOT EXISTS academy_roles_secundarios (
    id          serial PRIMARY KEY,
    academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    nombre      text        NOT NULL,
    permisos    text[]      NOT NULL DEFAULT '{}'::text[],
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT academy_roles_secundarios_unico UNIQUE (academy_id, nombre)
  );
  CREATE TABLE IF NOT EXISTS academy_usuario_roles (
    id               serial PRIMARY KEY,
    rol_id           integer NOT NULL REFERENCES academy_roles_secundarios(id) ON DELETE CASCADE,
    academy_user_id  integer NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
    CONSTRAINT academy_usuario_roles_unico UNIQUE (rol_id, academy_user_id)
  );

  -- -----------------------------------------------------------------------------
  -- 2. CURSOS COMO EN ARTIEFY (rating, instructores, parámetros, clases y
  --    actividades)
  -- -----------------------------------------------------------------------------

  ALTER TABLE academy_courses ADD COLUMN IF NOT EXISTS rating real NOT NULL DEFAULT 0;

  CREATE TABLE IF NOT EXISTS academy_course_instructors (
    id serial PRIMARY KEY,
    course_id integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    CONSTRAINT academy_course_instructors_unico UNIQUE (course_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS academy_parametros (
    id serial PRIMARY KEY,
    academy_id integer NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
    course_id integer NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    porcentaje integer NOT NULL,
    number_of_activities integer NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS academy_parametros_course_idx ON academy_parametros (course_id);

  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS cover_image_key text;
  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS cover_video_key text;
  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS resource_key text;
  ALTER TABLE academy_lessons ADD COLUMN IF NOT EXISTS resource_names text;

  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS calificable boolean NOT NULL DEFAULT true;
  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS parametro_id integer
    REFERENCES academy_parametros(id) ON DELETE SET NULL;
  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS porcentaje real;
  ALTER TABLE academy_activities ADD COLUMN IF NOT EXISTS fecha_inicio timestamptz;
END $$;
