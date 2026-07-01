//src\server\db\index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { env } from '~/env';

import * as schema from './schema';

// Inicializa la conexión a Neon usando la URL de la base de datos
let sqlClient: ReturnType<typeof neon> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

try {
  sqlClient = neon(env.POSTGRES_URL);
  dbInstance = drizzle({ client: sqlClient, schema });
} catch (err) {
  // No mostramos la URL completa por seguridad
  console.error(
    'Error inicializando la conexión a la base de datos. Verifica POSTGRES_URL y la conectividad de red (proxy/firewall).'
  );
  console.error(
    'Si estás en una red corporativa, revisa HTTP_PROXY/HTTPS_PROXY/NO_PROXY.'
  );
  console.error('Error detalle:', err instanceof Error ? err.message : err);
  throw err;
}

if (!dbInstance) {
  throw new Error('No se pudo inicializar la conexión a la base de datos.');
}

// Exporta la conexión Drizzle para usarla en otros lugares del proyecto
export const db = dbInstance;
