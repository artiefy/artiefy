-- Academias: permitir que una cuenta existente (de Artiefy u otra academia)
-- se vincule a una academia, y que una misma cuenta esté en varias.
--
-- cuenta_propia = true  → la cuenta la creó la academia (aislada de Artiefy);
--                         al quitarla de su última academia se borra de Clerk.
-- cuenta_propia = false → cuenta existente vinculada; al quitarla solo pierde
--                         el acceso a la academia, la cuenta no se toca.
--
-- Reversible con:
--   ALTER TABLE academy_users DROP CONSTRAINT academy_users_cuenta_unica;
--   ALTER TABLE academy_users ADD CONSTRAINT academy_users_user_id_key UNIQUE (user_id);
--   ALTER TABLE academy_users DROP COLUMN cuenta_propia;

ALTER TABLE academy_users
  DROP CONSTRAINT IF EXISTS academy_users_user_id_key;

ALTER TABLE academy_users
  ADD CONSTRAINT academy_users_cuenta_unica UNIQUE (academy_id, user_id);

ALTER TABLE academy_users
  ADD COLUMN IF NOT EXISTS cuenta_propia boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS academy_users_user_idx ON academy_users (user_id);
