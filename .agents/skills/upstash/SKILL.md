---
name: upstash
description: Configure and use Upstash Redis and QStash in Next.js apps. Covers @upstash/redis client setup, caching patterns, rate limiting, session storage, and QStash for background jobs and scheduled tasks. Use when working with Redis caching, rate limiting, pub/sub, or background task queues.
---

# Upstash

Use this skill for all Upstash Redis and QStash operations in the project stack.

## Before Implementing

Always verify current stable versions before writing code:

- Check `@upstash/redis` latest stable: https://www.npmjs.com/package/@upstash/redis
- Check `@upstash/ratelimit` latest stable: https://www.npmjs.com/package/@upstash/ratelimit
- Check `@upstash/qstash` latest stable: https://www.npmjs.com/package/@upstash/qstash
- Official docs: https://upstash.com/docs/redis/overall/getstarted

## Setup

### Install

```bash
# Redis client
npm install @upstash/redis

# Rate limiting (optional)
npm install @upstash/ratelimit

# Background jobs (optional)
npm install @upstash/qstash
```

### Environment Variables (via @t3-oss/env-nextjs in src/env.ts)

```ts
UPSTASH_REDIS_REST_URL: z.string().url(),
UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
// Only if using QStash:
QSTASH_TOKEN: z.string().min(1).optional(),
QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
```

### Client Utility (src/lib/upstash.ts)

```ts
import { Redis } from '@upstash/redis';
import { env } from '@/env';

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
```

## Common Patterns

### Cache with TTL

```ts
import { redis } from '@/lib/upstash';

// Set with expiry (seconds)
await redis.set('key', JSON.stringify(data), { ex: 3600 });

// Get and parse
const cached = await redis.get<MyType>('key');
```

### Rate Limiting (Next.js Middleware / Route Handler)

```ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/upstash';

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// In route handler or middleware:
const identifier = request.headers.get('x-forwarded-for') ?? 'anonymous';
const { success, remaining } = await ratelimit.limit(identifier);
if (!success) {
  return new Response('Too many requests', { status: 429 });
}
```

### Session / Ephemeral Storage

```ts
// Store session data with TTL
await redis.set(`session:${userId}`, JSON.stringify(sessionData), {
  ex: 86400,
});

// Retrieve
const session = await redis.get<SessionData>(`session:${userId}`);

// Delete
await redis.del(`session:${userId}`);
```

### QStash — Background Job

```ts
import { Client } from '@upstash/qstash';
import { env } from '@/env';

const qstash = new Client({ token: env.QSTASH_TOKEN });

// Publish a task
await qstash.publishJSON({
  url: 'https://yourdomain.com/api/jobs/process-order',
  body: { orderId: '123' },
  delay: 0,
});
```

## Security Rules

- Never expose `UPSTASH_REDIS_REST_TOKEN` to the client — all Redis calls go through Server Actions or API routes.
- Use TTLs on all cached data to avoid stale reads.
- Use rate limiting on public API routes and auth endpoints.

## MCP

- No dedicated MCP for Upstash. Use official docs and context7 for current patterns.
- Official Redis docs: https://upstash.com/docs/redis/overall/getstarted
- Official QStash docs: https://upstash.com/docs/qstash/overall/getstarted
