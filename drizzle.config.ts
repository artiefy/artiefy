import { defineConfig } from 'drizzle-kit';

import { env } from '~/env';

export default defineConfig({
	schema: './src/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.POSTGRES_URL,
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
