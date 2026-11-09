-- Academias: tickets de cada academia hacia el soporte de Artiefy.
-- La academia ve los suyos (Tickets del panel de la academia) y el
-- super-admin de Artiefy los de todas (Academias › Tickets).
-- Tablas aparte de tickets/ticket_comments (Artiefy): las cuentas propias de
-- una academia no existen en users.
--
-- Reversible con:
--   DROP TABLE academy_ticket_comments;
--   DROP TABLE academy_tickets;

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

CREATE INDEX IF NOT EXISTS academy_tickets_academy_idx
  ON academy_tickets (academy_id);

CREATE TABLE IF NOT EXISTS academy_ticket_comments (
  id          serial PRIMARY KEY,
  ticket_id   integer     NOT NULL REFERENCES academy_tickets(id) ON DELETE CASCADE,
  user_id     text        NOT NULL,
  sender      text        NOT NULL CHECK (sender IN ('academia', 'artiefy')),
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academy_ticket_comments_ticket_idx
  ON academy_ticket_comments (ticket_id);
