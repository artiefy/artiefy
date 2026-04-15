---
name: drizzle-orm
description: Configure and use Drizzle ORM with Neon PostgreSQL in Next.js apps. Covers schema definition, migrations with drizzle-kit, queries, relations, Server Actions integration, and environment setup via @t3-oss/env-nextjs. Use when defining database schemas, writing queries, running migrations, or evolving the data model.
---

# Drizzle ORM

Use this skill for all Drizzle ORM operations in the project stack, always paired with Neon PostgreSQL.

## Before Implementing

Always verify current stable versions before writing code:

- Check `drizzle-orm` latest stable: https://www.npmjs.com/package/drizzle-orm
- Check `drizzle-kit` latest stable: https://www.npmjs.com/package/drizzle-kit
- Official docs: https://orm.drizzle.team/docs/overview
- Drizzle + Neon guide: https://orm.drizzle.team/docs/tutorials/drizzle-with-neon

## Setup

### Install

```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

### Environment Variables (via @t3-oss/env-nextjs in src/env.ts)

```ts
DATABASE_URL: z.string().url(),
```

### drizzle.config.ts (project root)

```ts
import { defineConfig } from 'drizzle-kit';
import { env } from './src/env';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
```

### Database Client (src/db/index.ts)

```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '@/env';
import * as schema from './schema';

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```

## Schema Definition (src/db/schema.ts)

```ts
import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // in cents
  imageKey: text('image_key'), // S3 key
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Relations

```ts
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));
```

## Common Queries

### Select

```ts
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

// All
const all = await db.select().from(products);

// By ID
const product = await db.select().from(products).where(eq(products.id, id));
```

### Insert

```ts
const [newProduct] = await db
  .insert(products)
  .values({ name: 'T-Shirt', price: 2999 })
  .returning();
```

### Update

```ts
await db.update(products).set({ price: 1999 }).where(eq(products.id, id));
```

### Delete

```ts
await db.delete(products).where(eq(products.id, id));
```

## Migrations

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations to Neon
npx drizzle-kit migrate

# Open Drizzle Studio (local DB browser)
npx drizzle-kit studio
```

## Integration with Server Actions

Always run Drizzle queries inside Server Actions or Route Handlers — never from Client Components:

```ts
'use server';
import { db } from '@/db';
import { products } from '@/db/schema';

export async function getProducts() {
  return db.select().from(products).orderBy(products.createdAt);
}
```

## Rules

- Schema lives in `src/db/schema.ts`, client in `src/db/index.ts`.
- All migrations go through `drizzle-kit generate` + `drizzle-kit migrate` — never edit migration files manually.
- Store prices as integers (cents), not floats.
- Use `uuid` as primary key with `defaultRandom()`.
- Always use `@t3-oss/env-nextjs` for `DATABASE_URL` — never `process.env` directly.

## MCP

- Use `mcp__neon__*` for Neon/Postgres operations that complement Drizzle.
- Use context7 to locate current Drizzle docs sections quickly.
- Official reference: https://orm.drizzle.team/docs/overview
