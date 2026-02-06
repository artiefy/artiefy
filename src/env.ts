import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
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

    N8N_BASE_URL: z.string().url().optional(),
    N8N_WEBHOOK_PATH: z.string().optional(),
    N8N_LICENSE_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1),
    // Optional: API key specifically for OpenAI Assistants (useful if you separate keys)
    OPENAI_ASSISTANT_API_KEY: z.string().min(1).optional(),
    // Optional: OpenAI Assistant ID (asst_...)
    OPENAI_ASSISTANT_ID: z.string().min(1).optional(),
    N8N_WEBHOOK_ID: z.string().min(1),

    ESP32_BASE_URL: z.string().url().optional(),
    ESP32_API_KEY: z.string().optional(),
    NEON_API_KEY: z.string().min(1),
  },
  /*
   * Environment variables available on the client (and server).
   *
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_URL: z.string().min(1),
    NEXT_PUBLIC_AWS_S3_URL: z.string().url(),
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_PAYU_URL: z.string().url(),
    NEXT_PUBLIC_N8N_WEBHOOK_URL: z.string().url(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   *
   * 💡 You'll get type errors if not all variables from `server` & `client` are included here.
   */
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
    NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,

    PASS: process.env.PASS,

    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    SKIP_ENV_VALIDATION: process.env.SKIP_ENV_VALIDATION === 'true' || false,

    N8N_BASE_URL: process.env.N8N_BASE_URL,
    N8N_WEBHOOK_PATH: process.env.N8N_WEBHOOK_PATH,
    N8N_LICENSE_KEY: process.env.N8N_LICENSE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID,
    N8N_WEBHOOK_ID: process.env.N8N_WEBHOOK_ID,
    NEON_API_KEY: process.env.NEON_API_KEY,
    OPENAI_ASSISTANT_API_KEY: process.env.OPENAI_ASSISTANT_API_KEY,

    ESP32_BASE_URL: process.env.ESP32_BASE_URL,
    ESP32_API_KEY: process.env.ESP32_API_KEY,
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
});

// Objeto legacy para compatibilidad con código existente
export const ENV = {
  N8N_BASE_URL: env.N8N_BASE_URL ?? '',
  N8N_WEBHOOK_PATH: env.N8N_WEBHOOK_PATH ?? '',
  OPENAI_API_KEY: env.OPENAI_API_KEY,
  OPENAI_ASSISTANT_ID: env.OPENAI_ASSISTANT_ID ?? '',
  OPENAI_ASSISTANT_API_KEY: env.OPENAI_ASSISTANT_API_KEY ?? '',
};
