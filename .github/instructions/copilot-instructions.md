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

## Reglas Adicionales de Desarrollo

- **Framework Base**: Todo el código debe estar basado en React y Next.js, siguiendo las mejores prácticas de componentes y hooks.
- **Preservación de Funcionalidades**: No modificar ni romper funcionalidades existentes que ya funcionaban correctamente, a menos que el usuario lo solicite explícitamente en el prompt.
- **Actualizaciones de Next.js**: Recomendar y aplicar mejoras que aprovechen las novedades de Next.js 16, consultando y actualizando el archivo `nextjs16-upgrade-guide-es.md` cuando sea relevante.
- **TypeScript**: Siempre tener en cuenta el uso de TypeScript y respetar las reglas y configuraciones definidas en el archivo `tsconfig.json`.
- **ESLint**: Insertar, reparar y refactorizar código siguiendo las reglas y recomendaciones de ESLint definidas en el archivo `eslint.config.mjs`.
- **Compatibilidad**: Validar que los cambios sean compatibles con la estructura y convenciones del proyecto.
- **Edición Directa**: Si es posible siempre editar los archivos directamente.

**Nota**: Todas las respuestas y comunicaciones deben darse en español.
