import { type Config } from 'drizzle-kit';

import { env } from '~/env';

export default {
	schema: './src/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.POSTGRES_URL,
	},
} satisfies Config;
