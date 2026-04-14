---
name: web-app-creator
description: Build and evolve production-ready starter or ecommerce web apps with Next.js 16 App Router, @t3-oss/env-nextjs, Clerk, Tailwind CSS, shadcn/ui, Drizzle ORM, Neon PostgreSQL, AWS S3, Upstash, Vercel, TypeScript, ESLint, Prettier, EditorConfig, Husky, and lint-staged. Use when the user asks to scaffold this stack end-to-end or continue backend/frontend development, including redesigns, new features, refactors, and environment hardening, always verifying latest stable versions from official docs and MCP tools.
---

# Web App Creator

Use this skill to create a complete baseline project with current stable dependencies and production-ready defaults.

## Workflow

1. Validate current stable versions before coding.

- Query official web docs for each technology in scope.
- Use `context7` as an accelerator to locate official sections/examples.
- Use `web.search` only as fallback and restrict to official domains.
- Build a version matrix with exact version numbers, release status, and links.
- If a version cannot be verified reliably, stop that package setup and report the gap.

2. Compose with specialized skills when available.

- Use `$nextjs-app-router-patterns` for App Router structure and conventions.
- Use `$clerk-nextjs-patterns` for auth integration.
- Use `$tailwind-design-system` and `$shadcn` for UI setup.
- Use `$neon-postgres` for Neon/Postgres integration.
- Use `$drizzle-orm` for schema definition, queries, and migrations.
- Use `$aws-s3` for file storage setup and presigned URL patterns.
- Use `$upstash` for Redis caching, rate limiting, and background jobs.
- Use `$frontend-skill`, `$security-best-practices`, and `$vercel-deploy` for quality and deployment readiness.

3. Scaffold and configure project.

- Create Next.js 16 app with TypeScript, App Router, ESLint, and Tailwind.
- Configure `@t3-oss/env-nextjs` + `zod` in `src/env.ts` as mandatory env layer.
- Configure Clerk server/client auth flow and middleware.
- Configure shadcn/ui base and add starter components.
- Configure Drizzle ORM + Neon: follow `$drizzle-orm` for schema, client, and migrations.
- Configure AWS S3: follow `$aws-s3` for client utility and presigned URL helpers.
- Configure Upstash Redis: follow `$upstash` for client utility and rate limiting.
- Configure ESLint + Prettier + TypeScript: follow the ESLint config pattern below.
- Configure Prettier, `.editorconfig`, Husky, and lint-staged with the pattern below.

### ESLint flat config (eslint.config.mjs)

Reference: https://nextjs.org/docs/app/api-reference/config/eslint

Required packages:

```bash
npm install --save-dev eslint-config-prettier
```

`eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals, // Next.js rules + React + jsx-a11y + import
  ...nextTs, // typescript-eslint rules via eslint-config-next
  // MUST be last: disables ESLint rules that conflict with Prettier
  prettierConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'drizzle/**',
  ]),
]);

export default eslintConfig;
```

Key rules:

- `eslint-config-next/core-web-vitals` already includes: Next.js plugin, React, react-hooks, jsx-a11y, import, typescript-eslint
- `eslint-config-next/typescript` adds stricter TypeScript rules
- `eslint-config-prettier` MUST come last — turns off formatting rules that conflict with Prettier
- Do NOT use `eslint-plugin-prettier` — it's slow and noisy; run Prettier separately

### lint-staged config (package.json)

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "prettier --write",
    "eslint --fix"
  ],
  "*.{json,md,css,mjs,cjs}": [
    "prettier --write"
  ]
}
```

Prettier runs first (format), then ESLint (fix lint issues). Order matters.

4. Continue development after initial scaffold.

- Detect current stack from `package.json`, config files, and existing code before applying changes.
- For each new prompt, identify impacted technologies and consult relevant skills + MCP docs first.
- Preserve existing architecture and naming conventions unless user requests a redesign.
- Implement backend and frontend changes incrementally and keep the app runnable after each task.
- Re-run relevant checks (`lint`, `typecheck`, `build`, and focused tests when available).

5. Create operational docs and environment files.

- Generate `.env.example` with all required variables.
- Write `README.md` with setup commands, architecture summary, and version matrix with links.

6. Validate implementation.

- Run `lint`, `typecheck`, and `build`.
- Fix errors before finalizing.
- Report output with changed files, run commands, and pending secrets/user actions.

## MCP Requirements

- Prefer `context7` for primary documentation lookup across all technologies.
- Use `next_devtools` for Next.js runtime diagnostics and verification.
- Use `mcp__clerk__*` for Clerk patterns/snippets.
- Use `mcp__shadcn__*` for shadcn component workflows.
- Use `mcp__neon__*` for Neon/PostgreSQL operations.
- For Drizzle ORM: fetch docs from `https://orm.drizzle.team/docs/overview` via context7 or web fetch.
- For AWS S3: fetch SDK v3 docs from `https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/`.
- For Upstash: fetch docs from `https://upstash.com/docs/redis/overall/getstarted`.
- For ESLint config: fetch `https://nextjs.org/docs/app/api-reference/config/eslint` before writing `eslint.config.mjs`.

## References

- Load `references/official-doc-sources.md` when collecting version and setup sources.
