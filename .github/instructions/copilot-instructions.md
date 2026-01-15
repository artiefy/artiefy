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

## Ejecución automática de MCP Tools

Los siguientes servidores MCP están configurados y deben usarse automáticamente en los contextos indicados:

### Context7 (Documentación actualizada)

**Cuándo usar automáticamente:**

- ANTES de implementar features con librerías externas (React, Next.js, Clerk, Drizzle, SWR, etc.)
- Cuando el usuario pregunte sobre APIs o funcionalidades de una librería
- Al encontrar código deprecated o patrones obsoletos
- Para verificar la sintaxis correcta de versiones específicas

**Herramientas disponibles:**

- `mcp_context7_resolve-library-id`: Primero para obtener el ID de la librería
- `mcp_context7_get-library-docs`: Luego para obtener la documentación actualizada

**Ejemplo de uso automático:**

```
Usuario: "Quiero agregar autenticación con Clerk"
→ Ejecutar automáticamente: resolve-library-id para Clerk
→ Luego: get-library-docs con el ID obtenido
→ Implementar según la documentación más reciente
```

### Shadcn (Componentes UI)

**Cuándo usar automáticamente:**

- Al crear nuevos componentes de UI (botones, forms, modals, cards, etc.)
- Cuando el usuario solicite agregar componentes de la UI
- Antes de crear componentes personalizados que puedan existir en shadcn
- Para mantener consistencia con el design system

**Herramientas disponibles:**

- `mcp_shadcn_list_items_in_registries`: Listar componentes disponibles
- `mcp_shadcn_get_add_command_for_items`: Obtener comando de instalación
- `mcp_shadcn_get_item_examples_from_registries`: Ver ejemplos de uso

**Ejemplo de uso automático:**

```
Usuario: "Necesito un botón con dropdown"
→ Ejecutar: list_items_in_registries buscando "button", "dropdown"
→ Si existe: get_add_command_for_items
→ Si no existe: crear componente personalizado
```

### Next-Devtools (Diagnóstico y desarrollo)

**Cuándo usar automáticamente:**

- Al detectar errores de compilación o runtime en Next.js
- Cuando el usuario reporte problemas en el servidor de desarrollo
- Para verificar el estado del build antes de implementar cambios críticos
- Al trabajar con cache y optimizaciones de Next.js 16

**Herramientas disponibles:**

- `mcp_next-devtools_nextjs_index`: Descubrir servidores y herramientas disponibles
- `mcp_next-devtools_nextjs_call`: Ejecutar herramientas específicas del servidor Next.js
- `mcp_next-devtools_browser_eval`: Automatización de pruebas en navegador
- `mcp_next-devtools_upgrade_nextjs_16`: Guía de actualización a Next.js 16

**Ejemplo de uso automático:**

```
Usuario: "El servidor no compila"
→ Ejecutar: nextjs_index para descubrir el servidor
→ Ejecutar: nextjs_call con toolName="get_errors"
→ Analizar y mostrar errores específicos
```

### Neon Database (Base de datos)

**Cuándo usar automáticamente:**

- Al crear o modificar esquemas de base de datos
- Cuando se requieran migraciones de datos
- Para ejecutar queries o transacciones complejas
- Al optimizar queries con EXPLAIN
- Para comparar schemas entre branches

**Herramientas disponibles:**

- `mcp_neondatabase__run_sql`: Ejecutar SQL individual
- `mcp_neondatabase__run_sql_transaction`: Ejecutar múltiples statements
- `mcp_neondatabase__explain_sql_statement`: Analizar performance de queries
- `mcp_neondatabase__get_connection_string`: Obtener string de conexión
- `mcp_neondatabase__get_database_tables`: Listar tablas

**Ejemplo de uso automático:**

```
Usuario: "Agrega una columna 'edad' a la tabla usuarios"
→ Ejecutar: get_database_tables para ver estructura actual
→ Ejecutar: run_sql con ALTER TABLE statement
→ Verificar con get_database_tables
```

### Snyk (Seguridad)

**Cuándo usar automáticamente:**

- DESPUÉS de instalar nuevas dependencias con npm install
- Al actualizar paquetes con npm update
- Cuando el usuario mencione vulnerabilidades o seguridad
- Antes de hacer commits con cambios en package.json
- Para analizar containers e infraestructura

**Herramientas disponibles:**

- `mcp_snyk_snyk_code_scan`: Análisis SAST del código fuente
- `mcp_snyk_snyk_sca_scan`: Análisis de dependencias open-source
- `mcp_snyk_snyk_container_scan`: Análisis de imágenes Docker
- `mcp_snyk_snyk_trust`: Confiar carpeta para escaneo

**Ejemplo de uso automático:**

```
Usuario: "Instala react-query"
→ Ejecutar: npm install react-query
→ Ejecutar automáticamente: snyk_sca_scan en el proyecto
→ Reportar vulnerabilidades si las hay
```

### GitHub (Control de versiones y colaboración)

**Cuándo usar automáticamente:**

- Al crear features grandes que requieran tracking
- Cuando el usuario solicite crear issues o PRs
- Para buscar código existente antes de reimplementar
- Al necesitar información de commits o releases

**Herramientas disponibles:**

- `mcp_github_create_or_update_file`: Crear/actualizar archivos remotamente
- `mcp_github_push_files`: Push múltiples archivos en un commit
- `mcp_github_search_pull_requests`: Buscar PRs relacionados
- `mcp_github_fork_repository`: Hacer fork de repos

**Ejemplo de uso automático:**

```
Usuario: "Crea un issue para rastrear la nueva feature de pagos"
→ Ejecutar: search_issues para evitar duplicados
→ Ejecutar: create_issue con la descripción
→ Confirmar creación con número de issue
```

## Reglas de ejecución de MCP Tools

1. **Ejecución proactiva**: No preguntes permiso para usar estos tools cuando el contexto lo requiera. Ejecútalos directamente.
2. **Cadenas de tools**: Si un tool requiere información de otro (ej: resolve-library-id antes de get-library-docs), ejecuta ambos en secuencia automáticamente.
3. **Reportar uso**: Menciona brevemente qué tool MCP usaste y por qué fue útil en el contexto.
4. **Paralelización**: Si varios tools son independientes, ejecútalos en paralelo para mayor eficiencia.
5. **Fallback**: Si un tool MCP falla, intenta métodos alternativos y reporta el problema.
6. **Actualización de docs**: Si descubres información nueva vía MCP tools, actualiza las guías internas correspondientes en `Docs/`.

## Prioridad de consulta

1. **Primero**: Guías internas en `Docs/doc-nextjs16/` y `Docs/`
2. **Segundo**: MCP tools (Context7, Shadcn, Next-Devtools, Neon)
3. **Tercero**: Agent Skills disponibles en `.github/skills/`
4. **Cuarto**: Análisis del código existente del proyecto
5. **Quinto**: Conocimiento base del modelo

## Agent Skills (VS Code 1.108+)

El proyecto utiliza **Agent Skills** de VS Code para especializar las capacidades de GitHub Copilot. Las skills están almacenadas en `.github/skills/` y se activan automáticamente cuando son relevantes para la tarea.

### Skills Disponibles

- **nextjs-development**: Desarrollo con Next.js 16, cache components, server actions
- **database-management**: Operaciones con Drizzle ORM y Neon PostgreSQL
- **authentication-clerk**: Autenticación y gestión de usuarios con Clerk
- **ui-components**: Componentes UI con shadcn/ui y TailwindCSS
- **ai-integration**: Integración de features de IA con OpenAI

### Cómo Usar Skills

Las skills se cargan automáticamente basadas en el contexto de tu consulta. Para activar manualmente una skill específica, incluye su nombre en la descripción de la tarea.

Ejemplo: "Crea un nuevo componente de formulario usando la skill ui-components"

### Creando Nuevas Skills

Para crear una nueva skill:

1. Crea un directorio en `.github/skills/nombre-skill/`
2. Crea un archivo `SKILL.md` con frontmatter YAML y contenido
3. Agrega recursos adicionales (scripts, ejemplos) si es necesario

Formato de SKILL.md:

```markdown
---
name: nombre-skill
description: Descripción de cuándo usar la skill
---

# Título de la Skill

Contenido detallado con instrucciones, ejemplos y recursos...
```
