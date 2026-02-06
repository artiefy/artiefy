//src\server\db\index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { env } from '~/env';

import * as schema from './schema';

// Inicializa la conexión a Neon usando la URL de la base de datos
const sql = neon(env.POSTGRES_URL);

// Exporta la conexión Drizzle para usarla en otros lugares del proyecto
export const db = drizzle({ client: sql, schema });
