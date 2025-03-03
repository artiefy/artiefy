import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    POSTGRES_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    MERCHANT_ID: z.string().nonempty(),
    ACCOUNT_ID: z.string().nonempty(),
    API_LOGIN: z.string().nonempty(),
    API_KEY: z.string().nonempty(),
    RESPONSE_URL: z.string().url(),
    CONFIRMATION_URL: z.string().url(),
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
  },

	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,

	UPSTASH_URL: process.env.UPSTASH_REDIS_REST_URL,
	UPSTASH_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
