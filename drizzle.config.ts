import { defineConfig } from 'drizzle-kit';

import { env } from '~/env';

import 'dotenv/config';

export default defineConfig({
  schema: './src/server/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    // Para migraciones en Neon, usar conexión directa (no pooler).
    url: env.POSTGRES_URL_NON_POOLING ?? env.POSTGRES_URL,
    ssl: true,
  },
  verbose: true,
  strict: true,
  entities: {
    roles: {
      provider: 'neon',
    },
  },
  schemaFilter: 'public',
  extensionsFilters: ['postgis'],
});
