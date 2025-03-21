import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
	server: {
		POSTGRES_URL: z.string().url(),
		NODE_ENV: z
			.enum(['development', 'test', 'production'])
			.default('development'),
		MERCHANT_ID: z.string().nonempty(),
		ACCOUNT_ID: z.string().nonempty(),
		API_LOGIN: z.string().nonempty(),
		API_KEY: z.string().nonempty(),
		RESPONSE_URL: z.string().url(),
		CONFIRMATION_URL: z.string().url(),
		AWS_ACCESS_KEY_ID: z.string().min(1),
		AWS_SECRET_ACCESS_KEY: z.string().min(1),
		AWS_REGION: z.string().min(1),
		AWS_BUCKET_NAME: z.string().min(1),
	},

	client: {},

	runtimeEnv: {
		POSTGRES_URL: process.env.POSTGRES_URL,
		NODE_ENV: process.env.NODE_ENV,
		MERCHANT_ID: process.env.MERCHANT_ID,
		ACCOUNT_ID: process.env.ACCOUNT_ID,
		API_LOGIN: process.env.API_LOGIN,
		API_KEY: process.env.API_KEY,
		RESPONSE_URL: process.env.RESPONSE_URL,
		CONFIRMATION_URL: process.env.CONFIRMATION_URL,
		AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
		AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
		AWS_REGION: process.env.AWS_REGION,
		AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
	},

	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
