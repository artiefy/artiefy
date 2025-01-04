-- Primero, añadir la nueva columna
ALTER TABLE "courses" ADD COLUMN "modalidades_id_new" integer;

-- Copiar los datos existentes (si hay alguno)
UPDATE "courses" SET "modalidades_id_new" = "modalidades_id";

-- Eliminar la constraint anterior
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_modalidades_id_fkey";

-- Añadir la nueva constraint
ALTER TABLE "courses" 
  ADD CONSTRAINT "courses_modalidades_id_new_fkey" 
  FOREIGN KEY ("modalidades_id_new") 
  REFERENCES "modalidades"("id");

-- Hacer la nueva columna NOT NULL si es necesario
ALTER TABLE "courses" ALTER COLUMN "modalidades_id_new" SET NOT NULL;

-- Eliminar la columna antigua
ALTER TABLE "courses" DROP COLUMN "modalidades_id";

-- Renombrar la nueva columna al nombre final
ALTER TABLE "courses" RENAME COLUMN "modalidades_id_new" TO "modalidades_id"; 