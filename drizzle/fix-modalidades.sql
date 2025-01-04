-- 1. Verificar la estructura actual
DO $$ 
BEGIN
    -- 2. Intentar eliminar la constraint si existe
    BEGIN
        ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_modalidadesid_fkey";
    EXCEPTION WHEN undefined_object THEN
        NULL;
    END;

    -- 3. Intentar añadir la columna modalidades_id si no existe
    BEGIN
        ALTER TABLE "courses" ADD COLUMN "modalidades_id" integer;
    EXCEPTION WHEN duplicate_column THEN
        NULL;
    END;

    -- 4. Actualizar la columna para asegurarnos que tenga los datos correctos
    UPDATE "courses" SET "modalidades_id" = "modalidadesid";

    -- 5. Hacer la columna NOT NULL
    ALTER TABLE "courses" ALTER COLUMN "modalidades_id" SET NOT NULL;

    -- 6. Añadir la foreign key
    ALTER TABLE "courses" 
    ADD CONSTRAINT "courses_modalidades_id_fkey" 
    FOREIGN KEY ("modalidades_id") 
    REFERENCES "modalidades"("id");

    -- 7. Finalmente, eliminar la columna antigua si existe
    BEGIN
        ALTER TABLE "courses" DROP COLUMN "modalidadesid";
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;
END $$; 