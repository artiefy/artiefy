import { sql } from "drizzle-orm";
import { db } from "../index";

export async function addModalidadesColumn() {
  try {
    // 1. Verificar si la columna existe
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'courses' AND column_name = 'modalidadesid'
        ) THEN
          -- Añadir la columna si no existe
          ALTER TABLE "courses" ADD COLUMN "modalidadesid" integer;
        END IF;
      END $$;
    `);

    // 2. Actualizar registros NULL
    await db.execute(sql`
      UPDATE "courses"
      SET "modalidadesid" = 1
      WHERE "modalidadesid" IS NULL;
    `);

    // 3. Verificar y añadir foreign key si no existe
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'courses_modalidadesid_fkey'
        ) THEN
          ALTER TABLE "courses"
          ADD CONSTRAINT "courses_modalidadesid_fkey"
          FOREIGN KEY ("modalidadesid") 
          REFERENCES "modalidades"("id");
        END IF;
      END $$;
    `);

    // 4. Hacer NOT NULL
    await db.execute(sql`
      ALTER TABLE "courses" 
      ALTER COLUMN "modalidadesid" SET NOT NULL;
    `);

    console.log("Columna modalidadesid actualizada exitosamente");
  } catch (error) {
    console.error("Error al actualizar la columna:", error);
    throw error;
  }
}

// Ejecutar la migración
addModalidadesColumn().catch(console.error);
