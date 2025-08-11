import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    POSTGRES_URL: z.string().url(),
    POSTGRES_URL_NON_POOLING: z.string().url(),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DATABASE: z.string().min(1),

    CLERK_SECRET_KEY: z.string().min(1),

    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

    AWS_BUCKET_NAME: z.string().min(1),
    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),

    MERCHANT_ID: z.string().min(1),
    ACCOUNT_ID: z.string().min(1),
    API_LOGIN: z.string().min(1),
    API_KEY: z.string().min(1),
    PAYU_API_URL: z.string().url(),
    RESPONSE_URL: z.string().url(),
    CONFIRMATION_URL: z.string().url(),
    CONFIRMATION_URL_PLANS: z.string().url(),
    CONFIRMATION_URL_COURSES: z.string().url(),

    PASS: z.string().min(1),

    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    CRON_SECRET: z.string().min(1),
    SKIP_ENV_VALIDATION: z.boolean().default(false),
  },
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_URL: z.string().min(1),
    NEXT_PUBLIC_AWS_S3_URL: z.string().url(),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_PAYU_URL: z.string().url(),
  },
  runtimeEnv: {
    POSTGRES_URL: process.env.POSTGRES_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,

    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_URL:
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_URL,

    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    NEXT_PUBLIC_AWS_S3_URL: process.env.NEXT_PUBLIC_AWS_S3_URL,

    MERCHANT_ID: process.env.MERCHANT_ID,
    ACCOUNT_ID: process.env.ACCOUNT_ID,
    API_LOGIN: process.env.API_LOGIN,
    API_KEY: process.env.API_KEY,
    PAYU_API_URL: process.env.PAYU_API_URL,
    RESPONSE_URL: process.env.RESPONSE_URL,
    CONFIRMATION_URL: process.env.CONFIRMATION_URL,
    CONFIRMATION_URL_PLANS: process.env.CONFIRMATION_URL_PLANS,
    CONFIRMATION_URL_COURSES: process.env.CONFIRMATION_URL_COURSES,
    NEXT_PUBLIC_PAYU_URL: process.env.NEXT_PUBLIC_PAYU_URL,

    PASS: process.env.PASS,

    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION === 'true' || false,
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});
