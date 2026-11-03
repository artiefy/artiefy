-- Academias (multi-tenant): cada academia es una "copia" de Artiefy con su
-- propio subdominio (<slug>.artiefy.com), logo y colores.
--
-- academy_users: las cuentas de cada academia. Las que crea la academia
-- (cuenta_propia) no se registran en la tabla users de Artiefy; una cuenta que
-- ya existía (de Artiefy u otra academia) se vincula con cuenta_propia = false.
-- (Si ya corriste una versión anterior: scripts/academies_vincular_cuentas.sql)
--
-- Reversible con:
--   DROP TABLE academy_users;
--   DROP TABLE academies;

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
  id          serial PRIMARY KEY,
  academy_id  integer     NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_id     text        NOT NULL,
  email       text        NOT NULL,
  name        text,
  role        text        NOT NULL
              CHECK (role IN ('super-admin', 'educador', 'estudiante')),
  cuenta_propia boolean   NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academy_users_email_unico UNIQUE (academy_id, email),
  CONSTRAINT academy_users_cuenta_unica UNIQUE (academy_id, user_id)
);

CREATE INDEX IF NOT EXISTS academy_users_user_idx ON academy_users (user_id);

CREATE INDEX IF NOT EXISTS academy_users_academy_idx
  ON academy_users (academy_id);
