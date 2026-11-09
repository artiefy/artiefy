-- =============================================================================
-- Academias: SQL ÚNICO = estructura completa + datos de ejemplo.
--
-- 1) Crea (si no existen) TODAS las tablas de academias y sus relaciones:
--    academias, cuentas, catálogos, cursos, lecciones, clases, actividades,
--    notas, matrículas, programas, grupos, pagos, proyectos, inscripciones, tickets,
--    logs y roles secundarios. Es el mismo contenido de los scripts
--    academy_*.sql, así que da igual si ya corriste alguno (IF NOT EXISTS).
--
-- 2) Crea una academia de ejemplo "academia-demo" (academia-demo.artiefy.com; en local
--    academia-demo.localhost:3000) con usuarios, cursos, lecciones, clases,
--    actividades, matrículas, programa, grupo, pagos, proyectos,
--    inscripciones, tickets, logs, roles y notas. Si la academia ya existe,
--    se borra y se vuelve a crear (solo academia-demo).
--
-- Usuarios de ejemplo: sus user_id ("seed_demo_*") NO son cuentas de Clerk,
-- así que no pueden iniciar sesión; solo llenan las listas. El super-admin es
-- tu cuenta (lmsg829@gmail.com), vinculada a la academia para que entres.
--
-- Es UNA sola sentencia (DO $$ … $$): se puede pegar y ejecutar en
-- Drizzle Studio (SQL), en el editor SQL de Neon o con psql. Corre en una
-- sola transacción: si algo falla, no queda nada a medias.
--
-- Para borrar SOLO los datos de ejemplo (todo cuelga de la academia):
--   DELETE FROM academies WHERE slug = 'academia-demo';
-- =============================================================================

DO $$
DECLARE
  -- Tu cuenta (super-admin de la academia de ejemplo).
  v_admin_id    text := 'user_2xKtEagK4eCdpZef9YF03nU7gE7';
  v_admin_email text := 'lmsg829@gmail.com';

  v_academia integer;
  v_cat_tec integer; v_cat_dis integer;
  v_mod_virtual integer; v_mod_presencial integer;
  v_niv_basico integer; v_niv_intermedio integer;
  v_hor_manana integer; v_hor_noche integer;
  v_esp_sala integer; v_esp_zoom integer;
  v_cert integer;
  v_curso_web integer; v_curso_diseno integer; v_curso_datos integer;
  v_leccion integer;
  v_programa integer;
  v_grupo integer;
  v_ticket integer;
  v_rol integer;
  v_curso integer;
  v_n integer;
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

  -- ---------------------------------------------------------------------------
  -- 2. DATOS DE EJEMPLO (academia-demo)
  -- ---------------------------------------------------------------------------

  -- Si ya existía (p. ej. corriste una versión anterior de este script), se
  -- borra y se vuelve a crear con TODOS los datos. Solo afecta a
  -- academia-demo: todo lo demás cuelga de ella con ON DELETE CASCADE.
  DELETE FROM academies WHERE slug = 'academia-demo';

  -- Academia.
  INSERT INTO academies (slug, nombre, acronimo, tipo, documento_tipo,
                         documento_numero, color_primario, color_fondo, created_by)
  VALUES ('academia-demo', 'Academia Demo', 'DEMO', 'empresa', 'NIT',
          '900123456-7', '#22C4D3', '#01142B', v_admin_id)
  RETURNING id INTO v_academia;

  -- Cuentas: tú (super-admin, vinculada), 2 educadores y 6 estudiantes.
  INSERT INTO academy_users (academy_id, user_id, email, name, role, cuenta_propia, activo, created_at)
  VALUES
    (v_academia, v_admin_id, v_admin_email, 'Super Admin Demo', 'super-admin', false, true, now() - interval '20 days'),
    (v_academia, 'seed_demo_educador_1', 'educador1@ejemplo.com', 'Carolina Ruiz', 'educador', true, true, now() - interval '15 days'),
    (v_academia, 'seed_demo_educador_2', 'educador2@ejemplo.com', 'Andrés Molina', 'educador', true, true, now() - interval '3 days'),
    (v_academia, 'seed_demo_estudiante_1', 'estudiante1@ejemplo.com', 'Laura Gómez', 'estudiante', true, true, now() - interval '1 days'),
    (v_academia, 'seed_demo_estudiante_2', 'estudiante2@ejemplo.com', 'Juan Pérez', 'estudiante', true, true, now() - interval '2 days'),
    (v_academia, 'seed_demo_estudiante_3', 'estudiante3@ejemplo.com', 'Valentina Ríos', 'estudiante', true, true, now() - interval '4 days'),
    (v_academia, 'seed_demo_estudiante_4', 'estudiante4@ejemplo.com', 'Camilo Herrera', 'estudiante', true, true, now() - interval '9 days'),
    (v_academia, 'seed_demo_estudiante_5', 'estudiante5@ejemplo.com', 'Sofía Martínez', 'estudiante', true, true, now() - interval '12 days'),
    (v_academia, 'seed_demo_estudiante_6', 'estudiante6@ejemplo.com', 'Mateo López', 'estudiante', true, false, now() - interval '30 days');

  -- Catálogos.
  INSERT INTO academy_categorias (academy_id, name) VALUES (v_academia, 'Tecnología') RETURNING id INTO v_cat_tec;
  INSERT INTO academy_categorias (academy_id, name) VALUES (v_academia, 'Diseño') RETURNING id INTO v_cat_dis;
  INSERT INTO academy_modalidades (academy_id, name) VALUES (v_academia, 'Virtual') RETURNING id INTO v_mod_virtual;
  INSERT INTO academy_modalidades (academy_id, name) VALUES (v_academia, 'Presencial') RETURNING id INTO v_mod_presencial;
  INSERT INTO academy_niveles (academy_id, name) VALUES (v_academia, 'Básico') RETURNING id INTO v_niv_basico;
  INSERT INTO academy_niveles (academy_id, name) VALUES (v_academia, 'Intermedio') RETURNING id INTO v_niv_intermedio;
  INSERT INTO academy_horarios (academy_id, name) VALUES (v_academia, 'Mañana 8:00 - 12:00') RETURNING id INTO v_hor_manana;
  INSERT INTO academy_horarios (academy_id, name) VALUES (v_academia, 'Noche 6:00 - 9:00') RETURNING id INTO v_hor_noche;
  INSERT INTO academy_espacios (academy_id, name) VALUES (v_academia, 'Sala 1') RETURNING id INTO v_esp_sala;
  INSERT INTO academy_espacios (academy_id, name) VALUES (v_academia, 'Aula virtual') RETURNING id INTO v_esp_zoom;
  INSERT INTO academy_tipos_certificacion (academy_id, name) VALUES (v_academia, 'Certificado de asistencia') RETURNING id INTO v_cert;

  -- Cursos.
  INSERT INTO academy_courses (academy_id, title, subtitle, description, categoria_id,
         modalidad_id, nivel_id, horario_id, espacio_id, tipo_certificacion_id,
         instructor, creator_id, individual_price)
  VALUES (v_academia, 'Desarrollo Web desde Cero', 'HTML, CSS y JavaScript',
          'Aprende a construir sitios web modernos paso a paso.',
          v_cat_tec, v_mod_virtual, v_niv_basico, v_hor_noche, v_esp_zoom, v_cert,
          'seed_demo_educador_1', v_admin_id, 350000)
  RETURNING id INTO v_curso_web;

  INSERT INTO academy_courses (academy_id, title, subtitle, description, categoria_id,
         modalidad_id, nivel_id, horario_id, espacio_id, tipo_certificacion_id,
         instructor, creator_id, individual_price)
  VALUES (v_academia, 'Diseño Gráfico Profesional', 'Composición, color y tipografía',
          'Fundamentos del diseño para piezas digitales e impresas.',
          v_cat_dis, v_mod_presencial, v_niv_intermedio, v_hor_manana, v_esp_sala, v_cert,
          'seed_demo_educador_2', v_admin_id, 420000)
  RETURNING id INTO v_curso_diseno;

  INSERT INTO academy_courses (academy_id, title, subtitle, description, categoria_id,
         modalidad_id, nivel_id, horario_id, espacio_id, tipo_certificacion_id,
         instructor, creator_id, individual_price)
  VALUES (v_academia, 'Análisis de Datos con Excel', 'Tablas dinámicas y gráficos',
          'Convierte datos en decisiones con Excel.',
          v_cat_tec, v_mod_virtual, v_niv_basico, v_hor_noche, v_esp_zoom, NULL,
          'seed_demo_educador_1', v_admin_id, 280000)
  RETURNING id INTO v_curso_datos;

  -- Lecciones (3 por curso), cada una con 1-2 actividades y una clase.
  FOR v_curso, v_n IN
    SELECT c, row_number() OVER () FROM unnest(ARRAY[v_curso_web, v_curso_diseno, v_curso_datos]) AS c
  LOOP
    FOR i IN 1..3 LOOP
      INSERT INTO academy_lessons (academy_id, course_id, title, description, orden, duracion_min)
      VALUES (v_academia, v_curso,
              'Lección ' || i || ': ' || (ARRAY['Introducción', 'Práctica guiada', 'Proyecto final'])[i],
              'Contenido de la lección ' || i || '.', i, 30 + i * 15)
      RETURNING id INTO v_leccion;

      INSERT INTO academy_activities (academy_id, lesson_id, title, description, tipo, fecha_limite, puntaje)
      VALUES (v_academia, v_leccion, 'Taller ' || i, 'Resuelve el taller de la lección ' || i || '.',
              'tarea', now() + (i * 7 || ' days')::interval, 100);
      IF i = 2 THEN
        INSERT INTO academy_activities (academy_id, lesson_id, title, description, tipo, fecha_limite, puntaje)
        VALUES (v_academia, v_leccion, 'Quiz de repaso', 'Preguntas de la lección 2.',
                'quiz', now() + interval '10 days', 50);
      END IF;
      IF i = 3 THEN
        INSERT INTO academy_activities (academy_id, lesson_id, title, description, tipo, fecha_limite, puntaje)
        VALUES (v_academia, v_leccion, 'Entrega del proyecto', 'Sube el enlace de tu proyecto final.',
                'proyecto', now() + interval '30 days', 200);
      END IF;

      INSERT INTO academy_clases (academy_id, course_id, lesson_id, titulo, inicio, fin, enlace)
      VALUES (v_academia, v_curso, v_leccion, 'Clase ' || i,
              date_trunc('day', now()) + ((i * 7 + v_n) || ' days')::interval + interval '18 hours',
              date_trunc('day', now()) + ((i * 7 + v_n) || ' days')::interval + interval '20 hours',
              'https://meet.example.com/demo-' || v_curso || '-' || i);
    END LOOP;
  END LOOP;

  -- Matrículas.
  INSERT INTO academy_enrollments (academy_id, course_id, user_id, completed, enrolled_at) VALUES
    (v_academia, v_curso_web,    'seed_demo_estudiante_1', false, now() - interval '1 days'),
    (v_academia, v_curso_web,    'seed_demo_estudiante_2', false, now() - interval '2 days'),
    (v_academia, v_curso_web,    'seed_demo_estudiante_3', true,  now() - interval '4 days'),
    (v_academia, v_curso_web,    'seed_demo_estudiante_4', false, now() - interval '9 days'),
    (v_academia, v_curso_diseno, 'seed_demo_estudiante_3', false, now() - interval '4 days'),
    (v_academia, v_curso_diseno, 'seed_demo_estudiante_5', false, now() - interval '12 days'),
    (v_academia, v_curso_datos,  'seed_demo_estudiante_1', false, now() - interval '1 days'),
    (v_academia, v_curso_datos,  'seed_demo_estudiante_6', true,  now() - interval '30 days');

  -- Notas: cada matriculado tiene nota en las actividades de las dos
  -- primeras clases de su curso (entre 60% y 100% del puntaje).
  INSERT INTO academy_activity_grades (academy_id, activity_id, user_id, nota)
  SELECT v_academia, a.id, e.user_id,
         round((a.puntaje * (0.6 + random() * 0.4))::numeric, 1)
  FROM academy_enrollments e
  JOIN academy_lessons l ON l.course_id = e.course_id AND l.orden <= 2
  JOIN academy_activities a ON a.lesson_id = l.id
  WHERE e.academy_id = v_academia;

  -- Programa con dos cursos.
  INSERT INTO academy_programas (academy_id, title, description)
  VALUES (v_academia, 'Técnico en Desarrollo Digital', 'Programa de desarrollo web y análisis de datos.')
  RETURNING id INTO v_programa;
  INSERT INTO academy_programa_cursos (programa_id, course_id) VALUES
    (v_programa, v_curso_web), (v_programa, v_curso_datos);

  -- Grupo del curso de desarrollo web.
  INSERT INTO academy_grupos (academy_id, nombre, course_id)
  VALUES (v_academia, 'Web Noche 2026-1', v_curso_web)
  RETURNING id INTO v_grupo;
  INSERT INTO academy_grupo_estudiantes (grupo_id, user_id) VALUES
    (v_grupo, 'seed_demo_estudiante_1'), (v_grupo, 'seed_demo_estudiante_2'),
    (v_grupo, 'seed_demo_estudiante_3'), (v_grupo, 'seed_demo_estudiante_4');

  -- Pagos.
  INSERT INTO academy_pagos (academy_id, user_id, concepto, monto, fecha, metodo, estado, created_by) VALUES
    (v_academia, 'seed_demo_estudiante_1', 'Matrícula Desarrollo Web', 350000, current_date - 1,  'Transferencia', 'pagado',    v_admin_id),
    (v_academia, 'seed_demo_estudiante_2', 'Matrícula Desarrollo Web', 350000, current_date - 2,  'Efectivo',      'pagado',    v_admin_id),
    (v_academia, 'seed_demo_estudiante_3', 'Matrícula Diseño Gráfico', 420000, current_date - 4,  'Transferencia', 'pendiente', v_admin_id),
    (v_academia, 'seed_demo_estudiante_5', 'Mensualidad',              150000, current_date - 12, 'Tarjeta',       'pagado',    v_admin_id),
    (v_academia, 'seed_demo_estudiante_6', 'Matrícula Excel',          280000, current_date - 30, 'Efectivo',      'anulado',   v_admin_id);

  -- Proyectos de estudiantes dentro de sus cursos.
  INSERT INTO academy_proyectos (academy_id, course_id, user_id, titulo, descripcion, enlace, estado) VALUES
    (v_academia, v_curso_web,    'seed_demo_estudiante_1', 'Portafolio personal', 'Sitio con mis trabajos.', 'https://example.com/portafolio', 'en progreso'),
    (v_academia, v_curso_web,    'seed_demo_estudiante_3', 'Tienda en línea', 'Catálogo con carrito.', NULL, 'aprobado'),
    (v_academia, v_curso_diseno, 'seed_demo_estudiante_5', 'Identidad de marca', 'Logo y manual de marca.', NULL, 'entregado');

  -- Inscripciones del formulario público.
  INSERT INTO academy_inscripciones (academy_id, nombre, email, telefono, documento, course_id, mensaje, estado) VALUES
    (v_academia, 'Daniela Castro', 'daniela@ejemplo.com', '3001234567', '1010101010', v_curso_web, 'Quiero información de horarios.', 'nueva'),
    (v_academia, 'Felipe Rojas', 'felipe@ejemplo.com', '3109876543', NULL, v_curso_diseno, NULL, 'contactada'),
    (v_academia, 'Isabela Mora', 'isabela@ejemplo.com', NULL, NULL, NULL, '¿Tienen cursos los sábados?', 'descartada');

  -- Tickets al soporte de Artiefy.
  INSERT INTO academy_tickets (academy_id, creator_id, email, title, description, tipo, estado)
  VALUES (v_academia, v_admin_id, v_admin_email, 'No carga el video de una lección',
          'El video de la lección 2 de Desarrollo Web no reproduce.', 'bug', 'en proceso')
  RETURNING id INTO v_ticket;
  INSERT INTO academy_ticket_comments (ticket_id, user_id, sender, content) VALUES
    (v_ticket, v_admin_id, 'academia', '¿Pueden revisarlo hoy?'),
    (v_ticket, v_admin_id, 'artiefy', 'Lo estamos revisando, te avisamos.');
  INSERT INTO academy_tickets (academy_id, creator_id, email, title, description, tipo, estado)
  VALUES (v_academia, v_admin_id, v_admin_email, 'Agregar nuevo horario',
          'Necesitamos un horario de sábados.', 'soporte', 'abierto');

  -- Roles secundarios.
  INSERT INTO academy_roles_secundarios (academy_id, nombre, permisos)
  VALUES (v_academia, 'Coordinador académico', ARRAY['estudiantes', 'grupos', 'cursos', 'proyectos'])
  RETURNING id INTO v_rol;
  INSERT INTO academy_usuario_roles (rol_id, academy_user_id)
  SELECT v_rol, id FROM academy_users
  WHERE academy_id = v_academia AND user_id = 'seed_demo_educador_1';
  INSERT INTO academy_roles_secundarios (academy_id, nombre, permisos)
  VALUES (v_academia, 'Cartera', ARRAY['finanzas']);

  -- Logs.
  INSERT INTO academy_logs (academy_id, actor_id, actor_email, accion, detalle) VALUES
    (v_academia, v_admin_id, v_admin_email, 'Academia creada', 'Datos de ejemplo'),
    (v_academia, v_admin_id, v_admin_email, 'Curso creado', 'Desarrollo Web desde Cero'),
    (v_academia, v_admin_id, v_admin_email, 'Grupo creado', 'Web Noche 2026-1'),
    (v_academia, v_admin_id, v_admin_email, 'Pago registrado', 'estudiante1@ejemplo.com · $350000');

  RAISE NOTICE 'academia-demo creada con id %', v_academia;
END
$$;

