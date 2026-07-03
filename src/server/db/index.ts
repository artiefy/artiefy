//src\server\db\index.ts
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { env } from '~/env';

import * as schema from './schema';

let sqlClient: ReturnType<typeof neon> | null = null;
let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

try {
  sqlClient = neon(env.POSTGRES_URL);
  dbInstance = drizzle({ client: sqlClient, schema });
} catch (err) {
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

export const db = dbInstance;
