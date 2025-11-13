# Copilot Instructions for Artiefy

## Project Overview

Artiefy is a modern educational platform built with Next.js, TypeScript, and TailwindCSS, integrating AI-driven features and multi-role user management. The architecture is modular, with clear separation between app logic, components, server actions, and configuration.

## Key Architectural Patterns

- **App Structure**: Main app logic resides in `src/app/`, with subfolders for routes, error handling, layouts, and role-based dashboards (e.g., `super-admin`, `admin`, `educadores`, `estudiantes`).
- **Components**: Shared and role-specific UI components are in `src/components/`. Use these for consistent UI/UX.
- **Server Logic**: API routes and server actions are in `src/app/api/` and `src/server/`. Database queries and helpers are organized under `src/server/db/` and `src/server/queries/`.
- **Configuration**: Environment variables are managed via `src/env.ts` using `@t3-oss/env-nextjs` and Zod for validation. Sensitive config samples are in `src/config/`.
- **Models**: Data models are grouped by user role in `src/models/`.
- **Styles**: All CSS is in `src/styles/`, with TailwindCSS as the main styling approach.

## Developer Workflows

- **Development**: Use `npm run dev` to start the Next.js development server.
- **Build**: Run `npm run build` for production builds. Use `npm run preview` to test the build locally.
- **Linting & Formatting**: Use `npm run lint` and `npm run format:write` to enforce code style. Type checking: `npm run typecheck`.
- **Database**: Use Drizzle ORM via scripts like `npm run db:generate`, `npm run db:migrate`, and `npm run db:studio`.
- **Pre-commit**: Run `npm run precommit:check` for pre-commit hooks.

## Project-Specific Conventions

- **Role-Based Routing**: Dashboard routes and UI are determined by user roles (`super-admin`, `admin`, `educador`, `estudiante`). See logic in `src/app/page.tsx`.
- **Environment Validation**: All environment variables are validated at runtime using Zod schemas in `src/env.ts`.
- **API Communication**: Use fetch/axios for API calls. Internal APIs are under `/api/` routes.
- **External Integrations**: Includes Clerk for authentication, AWS S3 for storage, Upstash Redis for rate limiting, Drizzle ORM for database, and OpenAI for AI features.
- **File Naming**: Use kebab-case for folders and PascalCase for React components.

## Examples

- **Fetching Role-Based Dashboard**:

  ```tsx
  // src/app/page.tsx
  const dashboardRoute =
    user?.publicMetadata?.role === 'super-admin'
      ? '/dashboard/super-admin'
      : user?.publicMetadata?.role === 'admin'
        ? '/dashboard/admin'
        : user?.publicMetadata?.role === 'educador'
          ? '/dashboard/educadores'
          : '/estudiantes';
  ```

- **Environment Setup**:

  ```ts
  // src/env.ts
  export const env = createEnv({ ... });
  ```

## Integration Points

- **Authentication**: Clerk (`@clerk/nextjs`) in `src/app/` and `src/components/`.
- **Database**: Drizzle ORM, config in `drizzle.config.ts`.
- **AI Features**: OpenAI API key in environment, logic in `src/app/api/` and related components.
- **Storage**: AWS S3 credentials in environment, logic in `src/lib/` and `src/app/api/`.

## References

- Main entry: `src/app/page.tsx`
- Environment: `src/env.ts`
- Database: `drizzle.config.ts`, `src/server/db/`
- Auth: `src/app/sign-in/`, `src/app/sign-up/`, Clerk usage
- Components: `src/components/`
- Styles: `src/styles/`

## Guías internas obligatorias

- **Documentación oficial Next.js 16**: Consulta `Docs/doc-nextjs16/How-to-upgrade-to-version-16.md` antes de proponer o aplicar cambios en rutas, layouts, caché, server actions, edge runtime o configuraciones. Apóyate según el tema en los módulos oficiales de `Docs/doc-nextjs16/` (`cache-components.md`, `cacheLife.md`, `cacheTag.md`, `revalidateTag.md`, `updateTag.md`, `use-cache.md`, `not-found.md`) y cita la sección utilizada en tu respuesta. Si falta contexto, actualiza el archivo correspondiente con el nuevo criterio.
- **SWR y consumo de datos**: Sigue `Docs/doc-nextjs16/guia-swr-nextjs.md` para cualquier lógica en cliente con SWR, creación de hooks o configuración de `SWRConfig`. Explica cómo el cambio respeta la guía y documenta ahí cualquier ajuste adicional aprobado.
- **Componentes en caché**: Revisa `Docs/doc-nextjs16/cache-components.md` al trabajar con Server Components compartidos, memoización o caché granular. Resume la sección aplicada cuando sea pertinente.

## Reglas adicionales de desarrollo (Next.js 16 y SWR)

- **Framework base**: Todo el código debe apoyarse en React y Next.js 16, aprovechando las APIs modernas descritas en las guías internas.
- **Renderizado por defecto en el servidor**: Prioriza SSR/SSG/ISR y los Server Components. Solo marca un componente como cliente cuando sea imprescindible (interactividad, hooks de estado, SWR).
- **Optimización de recursos**: Evita peticiones 200 infinitas y el exceso de data egress. Prefiere recopilar los datos en el backend y transferir únicamente lo necesario al cliente.
- **SWR como estándar en cliente**: Para interactividad o refresco, usa la librería SWR conforme a `Docs/doc-nextjs16/guia-swr-nextjs.md`, con hooks reutilizables y `SWRConfig` definido en layouts cliente cuando aplique.
- **API y backend**: Coloca la lógica de datos en server actions, API routes o Server Components. Los componentes cliente deben recibir datos ya preparados o gestionados vía SWR.
- **Evitar fetch directo en cliente**: No utilices `fetch` directo en componentes cliente salvo dentro de SWR o si la guía justifica la excepción.
- **Actualizaciones de Next.js**: Identifica y aplica mejoras de Next.js 16 (cache components, proxy, nuevas APIs de caché, etc.) y actualiza `Docs/doc-nextjs16/How-to-upgrade-to-version-16.md` con las decisiones relevantes.
- **TypeScript**: Mantén tipado estricto y usa las utilidades de Next.js 16 para tipar props, params y `searchParams` asíncronos.
- **ESLint**: Refactoriza y valida el código con las reglas definidas en `eslint.config.mjs`.
- **Compatibilidad**: Asegura que los cambios respetan la estructura y convenciones del proyecto.
- **Edición directa**: Edita los archivos directamente cuando sea posible, mencionando cómo se siguieron las guías internas en la respuesta.

### Gestión de variables de entorno (env)

- Siempre que añadas una nueva variable de entorno, agrégala en el esquema de validación de `src/env.ts` usando Zod y en el objeto `runtimeEnv`.
- Importa siempre el archivo `env.ts` en cualquier archivo de configuración global como `next.config.mjs`/`.ts`/`.js` para validar y acceder a las variables.
- Ejemplo:

  ```ts
  // src/env.ts
  import { createEnv } from '@t3-oss/env-nextjs';
  import { z } from 'zod';
  export const env = createEnv({
    server: {
      NUEVA_ENV: z.string().min(1),
      // ...otras envs
    },
    runtimeEnv: {
      NUEVA_ENV: process.env.NUEVA_ENV,
      // ...otras envs
    },
  });
  ```

  ```js
  // next.config.mjs
  import { env } from './src/env.ts';
  // ...usar env.NUEVA_ENV
  ```

### Ejemplo de patrón recomendado (SSR + SWR)

```tsx
// Server Component (por defecto)
export default async function Page() {
  const data = await getDataFromServer();
  return <ClientSection fallbackData={data} />;
}

// Client Component con SWR
('use client');
import useSWR from 'swr';

function ClientSection({ fallbackData }) {
  const { data, isLoading } = useSWR('/api/data', fetcher, { fallbackData });
  // ...render
}
```

**Nota**: Todas las respuestas y comunicaciones deben darse en español.
