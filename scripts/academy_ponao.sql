-- =============================================================================
-- ACADEMIA PONAO (ponao.artiefy.com) — creación completa desde Artiefy
-- =============================================================================
-- Requiere: scripts/academy_produccion.sql ya corrido.
--
-- Qué hace (UNA sola sentencia DO $$ … $$, en una transacción: si algo falla
-- no queda nada a medias; se puede pegar en Drizzle Studio o en Neon):
--   1. Crea la academia PONAO (slug "ponao", "de Artiefy").
--   2. Tu cuenta (lmsg829@gmail.com) queda como super-admin de PONAO
--      (misma cuenta y contraseña de Artiefy).
--   3. Copia los CURSOS DE PRUEBA de Artiefy (título con "prueba", o los ids
--      que pongas en v_cursos) con TODO:
--        catálogos (categoría, modalidad, nivel, horario, espacio,
--        certificación), rating, precio, educadores (vinculados como
--        educadores de PONAO), parámetros de evaluación, clases (portada,
--        video, recursos) y actividades (con su parámetro y peso).
--   4. Los ESTUDIANTES matriculados en esos cursos en Artiefy se vinculan a
--      PONAO como estudiantes (misma cuenta) y se matriculan en la copia.
--   5. Programas de Artiefy que contengan esos cursos → programa en PONAO.
--   6. Un grupo por curso con sus estudiantes.
--   7. Logs de lo hecho.
--
-- Se puede volver a correr: no duplica la academia, ni las cuentas, ni un
-- curso que ya esté en PONAO con el mismo título.
--
-- No envía correos (eso solo lo hace la app): los vinculados entran con su
-- contraseña de siempre en https://ponao.artiefy.com.
-- =============================================================================

DO $$
DECLARE
  -- Cursos a copiar. NULL = todos los cursos de Artiefy cuyo título contiene
  -- "prueba". Para elegirlos a mano: ARRAY[12, 34]::int[]
  v_cursos      int[] := NULL;

  -- Super-admin de PONAO (tu cuenta). El id se busca por correo en `users`
  -- del MISMO entorno (desarrollo y producción tienen ids de Clerk distintos).
  v_admin_email text := 'lmsg829@gmail.com';
  v_admin_id    text := (SELECT id FROM users WHERE lower(email) = 'lmsg829@gmail.com' LIMIT 1);

  v_academia  integer;
  v_curso     record;
  v_nuevo     integer;
  v_cat       integer;
  v_mod       integer;
  v_niv       integer;
  v_hor       integer;
  v_esp       integer;
  v_cert      integer;
  v_nombre    text;
  v_principal text;
  v_param     record;
  v_np        integer;
  v_clase     record;
  v_nl        integer;
  v_orden     integer;
  v_prog      record;
  v_np_id     integer;
  v_grupo     integer;
  v_est       integer;
  v_total     integer := 0;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No existe % en users de este entorno', v_admin_email;
  END IF;

  -- ---------------------------------------------------------------- 1 ------
  INSERT INTO academies (slug, nombre, acronimo, tipo, es_artiefy, created_by)
  VALUES ('ponao', 'PONAO', 'PONAO', 'empresa', true, v_admin_id)
  ON CONFLICT (slug) DO NOTHING;
  SELECT id INTO v_academia FROM academies WHERE slug = 'ponao';

  -- ---------------------------------------------------------------- 2 ------
  INSERT INTO academy_users
    (academy_id, user_id, email, name, role, cuenta_propia, activo)
  SELECT v_academia, v_admin_id, v_admin_email,
         COALESCE((SELECT name FROM users WHERE id = v_admin_id), 'Administrador'),
         'super-admin', false, true
  ON CONFLICT DO NOTHING;

  -- Mapa de parámetros (Artiefy → PONAO) por curso.
  CREATE TEMP TABLE IF NOT EXISTS _ponao_param (
    origen integer PRIMARY KEY, destino integer
  ) ON COMMIT DROP;
  -- Cursos copiados (Artiefy → PONAO).
  CREATE TEMP TABLE IF NOT EXISTS _ponao_curso (
    origen integer PRIMARY KEY, destino integer
  ) ON COMMIT DROP;

  -- ---------------------------------------------------------------- 3 ------
  FOR v_curso IN
    SELECT c.*
    FROM courses c
    WHERE (v_cursos IS NULL AND c.title ILIKE '%prueba%')
       OR c.id = ANY (v_cursos)
    ORDER BY c.id
  LOOP
    -- Ya copiado antes (mismo título en PONAO): se reutiliza, no se duplica.
    SELECT id INTO v_nuevo FROM academy_courses
    WHERE academy_id = v_academia AND title = v_curso.title
    LIMIT 1;

    IF v_nuevo IS NULL THEN
      -- Catálogos por nombre (los crea si no existen; obligatorios → "General").
      v_nombre := COALESCE((SELECT name FROM categories WHERE id = v_curso.categoryid), 'General');
      INSERT INTO academy_categorias (academy_id, name) VALUES (v_academia, v_nombre) ON CONFLICT DO NOTHING;
      SELECT id INTO v_cat FROM academy_categorias WHERE academy_id = v_academia AND name = v_nombre;

      v_nombre := COALESCE((SELECT name FROM modalidades WHERE id = v_curso.modalidadesid), 'General');
      INSERT INTO academy_modalidades (academy_id, name) VALUES (v_academia, v_nombre) ON CONFLICT DO NOTHING;
      SELECT id INTO v_mod FROM academy_modalidades WHERE academy_id = v_academia AND name = v_nombre;

      v_nombre := COALESCE((SELECT name FROM nivel WHERE id = v_curso.nivelid), 'General');
      INSERT INTO academy_niveles (academy_id, name) VALUES (v_academia, v_nombre) ON CONFLICT DO NOTHING;
      SELECT id INTO v_niv FROM academy_niveles WHERE academy_id = v_academia AND name = v_nombre;

      v_hor := NULL;
      v_nombre := (SELECT name FROM schedule_options WHERE id = v_curso.schedule_option_id);
      IF v_nombre IS NOT NULL THEN
        INSERT INTO academy_horarios (academy_id, name) VALUES (v_academia, v_nombre) ON CONFLICT DO NOTHING;
        SELECT id INTO v_hor FROM academy_horarios WHERE academy_id = v_academia AND name = v_nombre;
      END IF;

      v_esp := NULL;
      v_nombre := (SELECT name FROM space_options WHERE id = v_curso.space_option_id);
      IF v_nombre IS NOT NULL THEN
        INSERT INTO academy_espacios (academy_id, name) VALUES (v_academia, v_nombre) ON CONFLICT DO NOTHING;
        SELECT id INTO v_esp FROM academy_espacios WHERE academy_id = v_academia AND name = v_nombre;
      END IF;

      v_cert := NULL;
      v_nombre := (SELECT name FROM certification_types WHERE id = v_curso.certification_type_id);
      IF v_nombre IS NOT NULL THEN
        INSERT INTO academy_tipos_certificacion (academy_id, name) VALUES (v_academia, v_nombre) ON CONFLICT DO NOTHING;
        SELECT id INTO v_cert FROM academy_tipos_certificacion WHERE academy_id = v_academia AND name = v_nombre;
      END IF;

      -- Educadores del curso (principal + course_instructors) → educadores de
      -- PONAO (misma cuenta). Si ya estaban con otro rol, se dejan como están.
      INSERT INTO academy_users
        (academy_id, user_id, email, name, role, cuenta_propia, activo)
      SELECT v_academia, u.id, lower(u.email), COALESCE(u.name, u.email),
             'educador', false, true
      FROM users u
      WHERE u.id = v_curso.instructor
         OR u.id IN (SELECT instructor_id FROM course_instructors WHERE course_id = v_curso.id)
      ON CONFLICT DO NOTHING;

      v_principal := CASE
        WHEN EXISTS (SELECT 1 FROM academy_users
                     WHERE academy_id = v_academia AND user_id = v_curso.instructor)
        THEN v_curso.instructor END;

      INSERT INTO academy_courses
        (academy_id, title, subtitle, description, cover_image_key,
         cover_video_course_key, categoria_id, modalidad_id, nivel_id,
         horario_id, espacio_id, tipo_certificacion_id, instructor,
         creator_id, individual_price, is_active, visibility, rating)
      VALUES
        (v_academia, v_curso.title, v_curso.subtitle, v_curso.description,
         v_curso.cover_image_key, v_curso.cover_video_course_key, v_cat, v_mod,
         v_niv, v_hor, v_esp, v_cert, v_principal, v_admin_id,
         v_curso.individual_price, COALESCE(v_curso.is_active, true),
         COALESCE(v_curso.visibility, true), COALESCE(v_curso.rating, 0))
      RETURNING id INTO v_nuevo;

      -- Instructores adicionales.
      INSERT INTO academy_course_instructors (course_id, user_id)
      SELECT v_nuevo, ci.instructor_id
      FROM course_instructors ci
      JOIN academy_users au
        ON au.academy_id = v_academia AND au.user_id = ci.instructor_id
      WHERE ci.course_id = v_curso.id
        AND ci.instructor_id IS DISTINCT FROM v_principal
      ON CONFLICT DO NOTHING;

      -- Parámetros de evaluación.
      FOR v_param IN
        SELECT * FROM parametros WHERE course_id = v_curso.id ORDER BY id
      LOOP
        INSERT INTO academy_parametros
          (academy_id, course_id, name, description, porcentaje, number_of_activities)
        VALUES
          (v_academia, v_nuevo, v_param.name, COALESCE(v_param.description, ''),
           v_param.porcentaje, GREATEST(COALESCE(v_param.number_of_activities, 1), 1))
        RETURNING id INTO v_np;
        INSERT INTO _ponao_param (origen, destino) VALUES (v_param.id, v_np)
        ON CONFLICT (origen) DO UPDATE SET destino = EXCLUDED.destino;
      END LOOP;

      -- Clases y sus actividades.
      v_orden := 0;
      FOR v_clase IN
        SELECT * FROM lessons WHERE course_id = v_curso.id ORDER BY order_index, id
      LOOP
        v_orden := v_orden + 1;
        INSERT INTO academy_lessons
          (academy_id, course_id, title, description, orden, duracion_min,
           cover_image_key, cover_video_key, resource_key, resource_names)
        VALUES
          (v_academia, v_nuevo, v_clase.title, v_clase.description, v_orden,
           v_clase.duration, NULLIF(v_clase.cover_image_key, ''),
           NULLIF(v_clase.cover_video_key, ''), NULLIF(v_clase.resource_key, ''),
           NULLIF(v_clase.resource_names, ''))
        RETURNING id INTO v_nl;

        INSERT INTO academy_activities
          (academy_id, lesson_id, title, description, tipo, puntaje,
           fecha_inicio, fecha_limite, calificable, parametro_id, porcentaje)
        SELECT v_academia, v_nl, a.name, a.description, 'tarea', 100,
               a.fecha_inicio_actividad, a.fecha_maxima_entrega,
               (pm.destino IS NOT NULL), pm.destino,
               CASE WHEN pm.destino IS NOT NULL THEN a.porcentaje END
        FROM activities a
        LEFT JOIN _ponao_param pm ON pm.origen = a.parametro_id
        WHERE a.lessons_id = v_clase.id
        ORDER BY a.id;
      END LOOP;

      INSERT INTO academy_logs (academy_id, actor_id, actor_email, accion, detalle)
      VALUES (v_academia, v_admin_id, v_admin_email, 'Curso recibido de Artiefy',
              v_curso.title || ' (#' || v_nuevo || ')');
      v_total := v_total + 1;
    END IF;

    INSERT INTO _ponao_curso (origen, destino) VALUES (v_curso.id, v_nuevo)
    ON CONFLICT (origen) DO NOTHING;

    -- ------------------------------------------------------------ 4 ------
    -- Estudiantes del curso en Artiefy → estudiantes de PONAO + matrícula.
    INSERT INTO academy_users
      (academy_id, user_id, email, name, role, cuenta_propia, activo)
    SELECT DISTINCT ON (u.id) v_academia, u.id, lower(u.email),
           COALESCE(u.name, u.email), 'estudiante', false, true
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    WHERE e.course_id = v_curso.id
    ON CONFLICT DO NOTHING;

    INSERT INTO academy_enrollments (academy_id, course_id, user_id, completed, enrolled_at)
    SELECT v_academia, v_nuevo, e.user_id, COALESCE(e.completed, false), e.enrolled_at
    FROM enrollments e
    JOIN academy_users au ON au.academy_id = v_academia AND au.user_id = e.user_id
    WHERE e.course_id = v_curso.id
    ON CONFLICT DO NOTHING;
    GET DIAGNOSTICS v_est = ROW_COUNT;

    -- ------------------------------------------------------------ 6 ------
    -- Un grupo por curso con sus estudiantes.
    SELECT id INTO v_grupo FROM academy_grupos
    WHERE academy_id = v_academia AND course_id = v_nuevo LIMIT 1;
    IF v_grupo IS NULL THEN
      INSERT INTO academy_grupos (academy_id, nombre, course_id)
      VALUES (v_academia, 'Grupo ' || v_curso.title, v_nuevo)
      RETURNING id INTO v_grupo;
    END IF;
    INSERT INTO academy_grupo_estudiantes (grupo_id, user_id)
    SELECT v_grupo, ae.user_id
    FROM academy_enrollments ae
    WHERE ae.course_id = v_nuevo
    ON CONFLICT DO NOTHING;

    IF v_est > 0 THEN
      INSERT INTO academy_logs (academy_id, actor_id, actor_email, accion, detalle)
      VALUES (v_academia, v_admin_id, v_admin_email, 'Estudiantes matriculados',
              v_est || ' en ' || v_curso.title);
    END IF;
  END LOOP;

  -- ---------------------------------------------------------------- 5 ------
  -- Programas de Artiefy que contienen esos cursos.
  FOR v_prog IN
    SELECT DISTINCT p.id, p.title, p.description
    FROM programas p
    JOIN materias m ON m.programa_id = p.id
    JOIN _ponao_curso pc ON pc.origen = m.courseid
  LOOP
    SELECT id INTO v_np_id FROM academy_programas
    WHERE academy_id = v_academia AND title = v_prog.title LIMIT 1;
    IF v_np_id IS NULL THEN
      INSERT INTO academy_programas (academy_id, title, description)
      VALUES (v_academia, v_prog.title, v_prog.description)
      RETURNING id INTO v_np_id;
    END IF;
    INSERT INTO academy_programa_cursos (programa_id, course_id)
    SELECT DISTINCT v_np_id, pc.destino
    FROM materias m
    JOIN _ponao_curso pc ON pc.origen = m.courseid
    WHERE m.programa_id = v_prog.id
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- ---------------------------------------------------------------- 7 ------
  INSERT INTO academy_logs (academy_id, actor_id, actor_email, accion, detalle)
  VALUES (v_academia, v_admin_id, v_admin_email, 'Academia PONAO preparada',
          v_total || ' curso(s) nuevos copiados desde Artiefy');

  RAISE NOTICE 'PONAO lista (academia #%): % curso(s) nuevos', v_academia, v_total;
END $$;
