ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "fecha_programa" date;

UPDATE "conversations"
SET "fecha_programa" = COALESCE("fecha_programa", "created_at"::date, CURRENT_DATE)
WHERE "fecha_programa" IS NULL;

ALTER TABLE "conversations"
  ALTER COLUMN "fecha_programa" SET NOT NULL;

ALTER TABLE "conversations"
  ADD COLUMN IF NOT EXISTS "fecha_real_pago" date;
