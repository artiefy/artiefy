-- Añadir la columna modalidadesid
ALTER TABLE "courses" 
ADD COLUMN IF NOT EXISTS "modalidadesid" integer;

-- Crear la foreign key
ALTER TABLE "courses"
ADD CONSTRAINT "courses_modalidadesid_fkey"
FOREIGN KEY ("modalidadesid") 
REFERENCES "modalidades"("id");

-- Hacer la columna NOT NULL después de añadirla
ALTER TABLE "courses" 
ALTER COLUMN "modalidadesid" SET NOT NULL; 