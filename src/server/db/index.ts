//src\server\db\index.ts
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// Carga variables de entorno desde .env o .env.local
config({ path: ".env" });

// Inicializa la conexión a Neon usando la URL de la base de datos
const sql = neon(process.env.NEXT_PUBLIC_DATABASE_URL!);

// Exporta la conexión Drizzle para usarla en otros lugares del proyecto
export const db = drizzle(sql, { schema });

console.log("Database URL:", process.env.NEXT_PUBLIC_DATABASE_URL);
