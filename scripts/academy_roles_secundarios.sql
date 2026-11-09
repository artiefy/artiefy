-- Academias: roles secundarios (Usuarios y Roles › Roles Secundarios) y su
-- asignación a cuentas de la academia.
--
-- Reversible con:
--   DROP TABLE academy_usuario_roles;
--   DROP TABLE academy_roles_secundarios;

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
