---
title: 'Next.js 16.3 — Guía de actualización y adopción para agentes de IA'
description: 'Runbook para analizar, actualizar, configurar, migrar y validar un repositorio local con Next.js 16.3.'
target: 'Repositorios existentes con Next.js App Router, TypeScript y Turbopack'
last_verified: '2026-08-04'
language: 'es'
---

# Next.js 16.3 — Guía de actualización y adopción para agentes de IA

> **Uso:** coloca este archivo en la raíz del repositorio y pídele al agente que lo lea completamente antes de modificar código.
>
> **Objetivo:** actualizar el proyecto a la última versión estable `16.3.x`, configurar la integración con agentes de IA y adoptar las novedades recomendables de Next.js 16.3 sin activar indiscriminadamente opciones experimentales.

---

## 1. Instrucción principal para el agente

Actúa como un ingeniero senior especializado en:

- Next.js 16.3 y App Router.
- React Server Components.
- React 19.
- TypeScript.
- Turbopack.
- Cache Components.
- Partial Prerendering.
- Instant Navigation y Partial Prefetching.
- Migraciones incrementales de repositorios existentes.
- Pruebas, rendimiento, accesibilidad y despliegue.

Debes trabajar directamente sobre el repositorio local siguiendo las fases de este documento.

### Reglas obligatorias

1. Lee primero este archivo completo.
2. Inspecciona el repositorio antes de modificarlo.
3. Detecta el gestor de paquetes existente y no lo cambies.
4. No mezcles `npm`, `pnpm`, `yarn` y `bun`.
5. No elimines configuraciones existentes sin comprender su propósito.
6. No agregues NestJS, React Compiler, TypeScript 7 ni funciones experimentales si el proyecto no las necesita.
7. No uses `typescript.ignoreBuildErrors`.
8. No desactives ESLint para hacer pasar el build.
9. No ocultes errores de hidratación, tipos o compilación.
10. No conviertas componentes a Client Components salvo que necesiten estado, efectos, eventos o APIs del navegador.
11. Conserva Server Components como opción predeterminada.
12. Implementa cambios pequeños, revisables y reversibles.
13. No realices commits, pushes, despliegues ni PR automáticamente, salvo instrucción explícita.
14. Antes de cada función nueva, consulta las documentaciones incluidas en la versión instalada de Next.js.
15. Si la documentación instalada contradice este archivo, sigue la documentación instalada y explica la diferencia.
16. No uses `next@canary` en producción salvo petición explícita.
17. No actualices todas las dependencias mayores a ciegas.
18. No cambies el comportamiento funcional o visual de la aplicación sin necesidad.
19. Mantén compatibilidad con Windows y PowerShell cuando escribas comandos para el usuario.
20. Finaliza mostrando archivos modificados, decisiones, riesgos pendientes y resultados de validación.

---

## 2. Fuente de verdad

El orden de prioridad para tomar decisiones es:

1. Documentación incluida en la versión instalada:

```text
node_modules/next/dist/docs/
```

2. Documentación oficial de Next.js 16.3.
3. Código y tipos exportados por la versión instalada.
4. Este runbook.
5. Conocimiento previo del agente.

No debes depender únicamente de información aprendida durante el entrenamiento del modelo.

### Cómo localizar documentación instalada

Puedes buscar documentación relevante con herramientas disponibles en el entorno:

```bash
rg -n "cacheComponents|partialPrefetching|use cache|instant navigation" node_modules/next/dist/docs
```

```bash
rg -n "useTypeScriptCli|turbopackMemoryEviction|import.meta.glob" node_modules/next/dist/docs
```

En PowerShell, si `rg` no está instalado:

```powershell
Get-ChildItem node_modules/next/dist/docs -Recurse -File |
  Select-String -Pattern "cacheComponents|partialPrefetching|use cache|instant navigation"
```

Next.js 16.3 también permite solicitar documentación web como Markdown agregando `.md` a una URL compatible. Esto es un respaldo; la documentación instalada sigue siendo preferible porque coincide con la versión real del proyecto.

---

## 3. Resultado esperado

Al terminar, el repositorio debe cumplir, cuando corresponda:

- Next.js actualizado a la última versión estable `16.3.x`.
- React y React DOM compatibles con esa versión.
- Node.js compatible con Next.js 16.
- Gestor de paquetes y lockfile conservados.
- `AGENTS.md` configurado.
- `CLAUDE.md` enlazado a `AGENTS.md` cuando sea útil.
- MCP de Next.js configurado si el agente utilizado lo soporta.
- Turbopack usado como bundler predeterminado, salvo incompatibilidad demostrada.
- Configuraciones antiguas migradas.
- Cache Components adoptado incrementalmente, cuando sea adecuado.
- Partial Prefetching adoptado solo después de Cache Components.
- Rutas dinámicas organizadas con límites de `<Suspense>`.
- Caché implementada cerca del acceso a datos.
- Invalidación de caché acorde con el caso de uso.
- Navegaciones importantes verificadas.
- Lint, tipos, pruebas y build exitosos.
- Sin opciones experimentales innecesarias.
- Informe final claro.

---

# PARTE I — AUDITORÍA Y ACTUALIZACIÓN

## 4. Fase 0: proteger el estado actual

Antes de modificar archivos:

```bash
git status --short
git branch --show-current
```

Si existen cambios locales, no los descartes ni sobrescribas.

Registra:

- Rama actual.
- Archivos modificados.
- Gestor de paquetes.
- Versión de Node.js.
- Versión de Next.js.
- Versión de React.
- Versión de TypeScript.
- Estructura monorepo o aplicación única.
- Uso de App Router o Pages Router.
- Configuración de Webpack.
- Configuración de Turbopack.
- Presencia de NestJS.
- Presencia de tests.
- Sistema de despliegue.
- Runtime Node.js o Edge.
- Uso de caché, ISR y rutas dinámicas.

### Comandos de inventario

```bash
node --version
npm --version
```

Adapta el segundo comando al gestor real.

```bash
node -p "require('./package.json').packageManager || 'packageManager no declarado'"
```

```bash
node -p "require('./node_modules/next/package.json').version"
```

```bash
node -p "require('./node_modules/react/package.json').version"
```

```bash
node -p "require('./node_modules/typescript/package.json').version"
```

Si alguna dependencia no está instalada, inspecciona `package.json` sin forzar una instalación todavía.

### Detectar el gestor de paquetes

Prioridad orientativa:

| Archivo                  | Gestor |
| ------------------------ | ------ |
| `pnpm-lock.yaml`         | pnpm   |
| `package-lock.json`      | npm    |
| `yarn.lock`              | Yarn   |
| `bun.lock` o `bun.lockb` | Bun    |

No regeneres el lockfile con otro gestor.

---

## 5. Fase 1: auditar APIs y configuraciones afectadas

Busca antes de actualizar:

```bash
rg -n "experimental_ppr|experimental\.ppr|dynamicIO|useCache" .
```

```bash
rg -n "export const (dynamic|revalidate|fetchCache|dynamicParams|runtime)" app src
```

```bash
rg -n "unstable_cache|unstable_noStore|noStore\(" app src
```

```bash
rg -n "cookies\(|headers\(|draftMode\(|searchParams|params" app src
```

```bash
rg -n "<Link|prefetch=\{true\}|prefetch=\{false\}" app src
```

```bash
rg -n "middleware\.|export function middleware|skipMiddleware" .
```

```bash
rg -n "webpack\s*:\s*\(|experimental\.turbo|turbo\s*:" next.config.*
```

```bash
rg -n "runtime\s*=\s*['\"]edge['\"]" app src
```

```bash
rg -n "Date\.now\(|new Date\(|Math\.random\(|randomUUID\(" app src
```

```bash
rg -n "usePathname\(|useParams\(|useSearchParams\(|useSelectedLayoutSegment" app src
```

Documenta cada coincidencia antes de cambiarla.

---

## 6. Fase 2: actualizar Next.js correctamente

### Requisitos mínimos conocidos de Next.js 16

- Node.js `20.9.0` o superior.
- TypeScript `5.1.0` o superior cuando se usa TypeScript.
- Navegadores modernos compatibles con los requisitos oficiales de Next.js 16.

Usa preferiblemente una versión LTS de Node.js compatible y fijada en el proyecto mediante una de estas opciones:

- `.nvmrc`
- `.node-version`
- Volta en `package.json`
- configuración equivalente del entorno

No cambies la versión de Node si la plataforma de despliegue no la soporta.

### Método recomendado: codemod oficial

Primero ejecuta una inspección y revisa el estado del repositorio.

Después utiliza el codemod oficial, apuntando a Next.js 16.3 estable:

```bash
npx @next/codemod@latest upgrade 16.3.0
```

Si ya existe una versión `16.3.x` posterior, no la reduzcas. Conserva la última revisión estable compatible.

El codemod puede ayudar a:

- actualizar Next.js, React y React DOM;
- migrar configuración antigua de Turbopack;
- reemplazar `next lint` por ESLint CLI;
- migrar `middleware` a `proxy`;
- retirar prefijos `unstable_` de APIs estabilizadas;
- eliminar configuraciones antiguas de PPR.

Revisa siempre el diff generado.

### Actualización manual

Solo si el codemod no es adecuado:

#### npm

```bash
npm install next@^16.3.0 react@latest react-dom@latest
npm install -D @types/react@latest @types/react-dom@latest
```

#### pnpm

```bash
pnpm add next@^16.3.0 react@latest react-dom@latest
pnpm add -D @types/react@latest @types/react-dom@latest
```

#### Yarn

```bash
yarn add next@^16.3.0 react@latest react-dom@latest
yarn add -D @types/react@latest @types/react-dom@latest
```

#### Bun

```bash
bun add next@^16.3.0 react@latest react-dom@latest
bun add -D @types/react@latest @types/react-dom@latest
```

No ejecutes todas las variantes. Usa exclusivamente la correspondiente al proyecto.

---

## 7. Uso seguro de npm-check-updates

`npm-check-updates` puede ayudar a descubrir versiones nuevas, pero no debe sustituir la revisión de compatibilidad.

### Inspección sin modificar

```bash
npx npm-check-updates
```

### Actualización del `package.json`

```bash
npx npm-check-updates -u
```

Después instala con el gestor existente.

### Reglas

- Revisa primero los cambios mayores.
- Actualiza Next.js mediante el codemod oficial cuando sea posible.
- No agregues NestJS si no existe.
- Si el repositorio contiene NestJS, actualízalo en una fase separada.
- No combines en un mismo cambio una migración importante de Next.js y otra de NestJS si dificulta el diagnóstico.
- Revisa peer dependencies.
- Revisa changelogs de librerías de autenticación, ORM, UI, testing y despliegue.
- No fuerces instalaciones ignorando conflictos sin explicar la causa.

### NestJS

Si `@nestjs/core` no existe, omite toda actualización de NestJS.

Si existe:

1. identifica la aplicación o workspace que lo utiliza;
2. revisa su versión actual;
3. consulta la guía oficial de migración de NestJS;
4. actualiza paquetes `@nestjs/*` de forma coordinada;
5. ejecuta sus tests y build independientemente;
6. no mezcles errores de NestJS con la migración de Next.js.

---

# PARTE II — CONFIGURACIÓN PARA AGENTES DE IA

## 8. Crear o actualizar `AGENTS.md`

Next.js incluye documentación correspondiente a la versión instalada dentro de `node_modules/next/dist/docs/`.

Crea `AGENTS.md` en la raíz si no existe. Si existe, conserva las instrucciones del proyecto y agrega una sección administrada para Next.js.

Plantilla recomendada:

```md
<!-- BEGIN:nextjs-agent-rules -->

# Reglas de Next.js para agentes

Antes de modificar código de Next.js:

1. Busca y lee la documentación relevante dentro de `node_modules/next/dist/docs/`.
2. Usa esa documentación como fuente principal porque coincide con la versión instalada.
3. No apliques APIs antiguas basándote únicamente en conocimiento previo.
4. Revisa los tipos y la configuración real del repositorio.
5. Ejecuta lint, comprobación de tipos, pruebas y build después de los cambios.

<!-- END:nextjs-agent-rules -->
```

Puedes agregar reglas propias fuera de los marcadores.

### Reglas de proyecto sugeridas para `AGENTS.md`

```md
## Arquitectura del proyecto

- App Router como sistema principal de rutas.
- Server Components por defecto.
- Client Components solo para interacción, estado, efectos o APIs del navegador.
- Acceso a datos en el servidor.
- Límites de Suspense pequeños y cercanos a la sección dinámica.
- Caché declarada cerca del acceso a datos.
- No usar `ignoreBuildErrors`.
- No silenciar errores de ESLint.
- Mantener accesibilidad y diseño responsive.
- Validar con lint, tipos, tests y build.
```

### `CLAUDE.md`

Si el repositorio usa Claude Code y no existe una configuración incompatible:

```md
@AGENTS.md
```

No dupliques todo el contenido de `AGENTS.md`.

---

## 9. Configurar Next.js DevTools MCP

Configura MCP solamente si el agente o editor utilizado lo soporta.

Crea o combina `.mcp.json`:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

Si `.mcp.json` ya existe:

- conserva los servidores existentes;
- combina la propiedad `next-devtools`;
- valida JSON;
- no sobrescribas credenciales ni configuraciones privadas.

### Uso esperado

Con `npm run dev` activo, el agente puede consultar:

- errores de compilación;
- errores de runtime;
- errores de tipos;
- información de rutas;
- metadatos;
- logs del servidor;
- estado de la aplicación;
- diagnósticos de Instant Navigation.

MCP no reemplaza lint, tipos, tests ni build.

---

## 10. Skills oficiales recomendados

### Cache Components

Instala el skill documentado por Next.js:

```bash
npx skills add vercel/next.js --skill next-cache-components-adoption
```

Prompt recomendado:

```text
Adopta Cache Components en este proyecto usando el skill next-cache-components-adoption. Trabaja incrementalmente, conserva el comportamiento actual, valida cada ruta y no habilites Partial Prefetching todavía.
```

### Partial Prefetching

Instálalo después de completar Cache Components:

```bash
npx skills add vercel/next.js --skill next-partial-prefetching-adoption
```

Prompt recomendado:

```text
Adopta Partial Prefetching en este proyecto usando el skill next-partial-prefetching-adoption. Audita todos los Link, las rutas con params y searchParams, los límites de Suspense y la precarga en runtime.
```

### Regla importante

No ejecutes ambos procesos como una única migración masiva.

Orden:

1. actualización base;
2. validación;
3. Cache Components;
4. validación;
5. Partial Prefetching;
6. validación final.

---

# PARTE III — TURBOPACK Y TYPESCRIPT

## 11. Turbopack en Next.js 16.3

Turbopack es el bundler predeterminado para:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

No es necesario conservar `--turbo` o `--turbopack`.

### Webpack como fallback

Usa Webpack únicamente si existe una incompatibilidad demostrada:

```json
{
  "scripts": {
    "dev:webpack": "next dev --webpack",
    "build:webpack": "next build --webpack"
  }
}
```

No cambies permanentemente a Webpack sin registrar la causa.

### Auditar configuración Webpack

Si existe:

```ts
webpack(config) {
  // ...
  return config
}
```

determina si depende de:

- plugins de Webpack;
- loaders;
- aliases;
- transformaciones de SVG;
- Sass personalizado;
- módulos no compatibles.

Turbopack acepta algunos loaders, pero no plugins de Webpack.

### Importaciones Sass antiguas

Evita:

```scss
@import '~bootstrap/dist/css/bootstrap.min.css';
```

Usa:

```scss
@import 'bootstrap/dist/css/bootstrap.min.css';
```

---

## 12. Caché de Turbopack

### Desarrollo

La caché de sistema de archivos para `next dev` está habilitada por defecto en versiones modernas de Next.js 16.

No agregues configuración redundante salvo que la versión instalada indique lo contrario.

### Builds persistentes

La caché persistente para `next build` es opt-in y debe tratarse como experimental hasta que la documentación instalada indique otra cosa:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default nextConfig;
```

Actívala solo si:

- el build base ya funciona;
- CI conserva correctamente `.next`;
- no se observan resultados obsoletos;
- se comparan builds fríos y calientes;
- existe una forma sencilla de desactivarla.

### Memory Eviction

`experimental.turbopackMemoryEviction` controla la liberación de memoria cuando existe caché persistente.

Valores documentados:

- `false`: no expulsa datos de memoria;
- `'auto'`: comportamiento predeterminado y recomendado;
- `'full'`: expulsa todo lo posible después de guardar snapshots.

No agregues esta opción si `'auto'` funciona correctamente.

Configuración explícita solo para investigar consumo de memoria:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbopackMemoryEviction: 'auto',
  },
};

export default nextConfig;
```

Usa `'full'` únicamente después de medir el impacto en memoria y tiempos de recarga.

---

## 13. `import.meta.glob`

Next.js 16.3 incorpora compatibilidad de Turbopack con patrones similares a Vite mediante `import.meta.glob`.

No migres importaciones existentes solamente porque la función está disponible.

Úsala cuando exista una necesidad real, por ejemplo:

- catálogo de archivos MDX;
- carga de módulos por convención;
- registro estático de contenido;
- reemplazo de una solución manual compleja.

Antes de aplicarla:

1. consulta la documentación instalada;
2. confirma compatibilidad con Server y Client Components;
3. verifica si la carga será eager o lazy;
4. comprueba los tipos generados;
5. valida producción con `next build`;
6. evita patrones demasiado amplios que incrementen el bundle.

---

## 14. React Compiler

`reactCompiler` es una opción estable de Next.js, pero no está habilitada por defecto.

No la actives automáticamente en una migración ya compleja.

### Activación aislada

```bash
npm install -D babel-plugin-react-compiler
```

Adapta el comando al gestor del proyecto.

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default nextConfig;
```

Recomendación:

1. completa primero la actualización a 16.3;
2. registra una medición base;
3. activa React Compiler en un cambio separado;
4. ejecuta tests y build;
5. compara tiempos de compilación y comportamiento;
6. revisa componentes con efectos, librerías mutables o reglas no compatibles.

Las mejoras internas del compilador en Rust de Next.js 16.3 pueden no requerir configuración adicional. No inventes flags: usa solo los documentados por la versión instalada.

---

## 15. TypeScript 6 y TypeScript 7

Next.js 16.3 puede ejecutar el CLI local de TypeScript durante `next build`.

La opción `experimental.useTypeScriptCli` está habilitada por defecto en la documentación de 16.3.

### Recomendación de producción

- Conserva la versión estable que sea compatible con el ecosistema del repositorio.
- No actualices a TypeScript 7 en el mismo cambio que Cache Components.
- Verifica primero ESLint, ORM, testing, generadores de tipos y librerías.

### Rama experimental con TypeScript 7

```bash
npm install -D typescript@^7
```

Adapta al gestor del proyecto.

No configures:

```ts
experimental: {
  useTypeScriptCli: false,
}
```

cuando uses TypeScript 7, porque el build depende del CLI mientras la API JavaScript requerida no esté disponible.

### Validación adicional

```bash
npx tsc --noEmit
```

```bash
npx next typegen
```

El proyecto seleccionado por `tsconfig.json` puede incluir tests y tipos generados. Revisa cuidadosamente `include` y `exclude`.

---

# PARTE IV — CACHE COMPONENTS

## 16. Decisión de adopción

Cache Components cambia el modelo de renderizado y caché. No debe activarse como un simple flag sin migración.

### Recomendación para repositorios existentes

Usa adopción incremental.

Ventajas:

- reduce el tamaño de cada cambio;
- facilita detectar regresiones;
- permite conservar rutas no migradas temporalmente;
- hace más fácil revisar caché, streaming y navegación por funcionalidad.

### Activación

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

Si existían:

```ts
experimental: {
  dynamicIO: true,
  useCache: true,
  ppr: true,
}
```

retíralas según la documentación y utiliza `cacheComponents`.

---

## 17. Modelo mental

Con Cache Components, divide cada ruta en tres clases.

### 17.1 Contenido estático

Código síncrono, imports y UI determinista.

```tsx
export default function Page() {
  return (
    <>
      <header>
        <h1>Productos</h1>
      </header>
      <ProductSection />
    </>
  );
}
```

### 17.2 Contenido cacheado

Datos que pueden reutilizarse durante cierto tiempo.

```tsx
import { cacheLife, cacheTag } from 'next/cache';

async function getProducts() {
  'use cache';
  cacheLife('hours');
  cacheTag('products');

  return db.product.findMany();
}
```

### 17.3 Contenido dinámico

Datos dependientes de la solicitud, sesión o tiempo real.

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<UserPanelSkeleton />}>
      <UserPanel />
    </Suspense>
  );
}
```

La meta es mantener la mayor parte posible de la interfaz dentro del App Shell y empujar el trabajo dinámico hacia límites pequeños de Suspense.

---

## 18. Estrategia incremental recomendada

1. Actualiza a Next.js 16.3.
2. Ejecuta lint, tipos, tests y build.
3. Instala el skill de Cache Components.
4. Activa `cacheComponents`.
5. Retira configuraciones de segmento incompatibles.
6. Agrega temporalmente `instant = false` en rutas no preparadas.
7. Corrige IO síncrono no determinista.
8. Migra una ruta o funcionalidad a la vez.
9. Retira `instant = false` de cada ruta migrada.
10. Repite hasta que no queden exclusiones.
11. Ejecuta pruebas de navegación.
12. Solo entonces evalúa Partial Prefetching.

### Opt-out temporal

```tsx
export const instant = false;
```

Esto permite que una ruta bloquee durante la transición, pero no soluciona automáticamente código no determinista ejecutado durante prerender.

### Codemod de opt-out masivo

Usa únicamente para iniciar una adopción incremental y revisa el diff:

```bash
npx @next/codemod@canary cache-components-instant-false ./app
```

Aunque el codemod utilice el canal canary, no significa que debas instalar `next@canary`.

---

## 19. Matriz de migración

| Configuración o API anterior         | Acción con Cache Components                             |
| ------------------------------------ | ------------------------------------------------------- |
| `dynamic = 'force-dynamic'`          | eliminar                                                |
| `dynamic = 'force-static'`           | eliminar y aplicar `use cache` cuando corresponda       |
| `revalidate = N`                     | reemplazar por `cacheLife`                              |
| `fetchCache`                         | eliminar y usar un scope `use cache`                    |
| `fetch(..., { cache, next })`        | mover política a `use cache`, `cacheLife` y `cacheTag`  |
| `unstable_cache`                     | convertir en función con `use cache`                    |
| `unstable_noStore` o `noStore()`     | eliminar; usar `connection()` para trabajo request-time |
| `experimental_ppr`                   | eliminar                                                |
| `experimental.ppr`                   | eliminar                                                |
| `dynamicParams`                      | eliminar                                                |
| `runtime = 'edge'`                   | retirar en rutas que usan Cache Components              |
| `revalidateTag(tag)` antiguo         | usar perfil, por ejemplo `revalidateTag(tag, 'max')`    |
| invalidación inmediata tras mutación | usar `updateTag` desde Server Action                    |

---

## 20. `use cache`, `cacheLife` y `cacheTag`

### Función cacheada

```tsx
import { cacheLife, cacheTag } from 'next/cache';

export async function getProduct(id: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('products', `product-${id}`);

  return db.product.findUnique({
    where: { id },
  });
}
```

Los argumentos serializables participan en la clave de caché.

### Perfil personalizado

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    catalog: {
      stale: 3600,
      revalidate: 900,
      expire: 86400,
    },
  },
};

export default nextConfig;
```

```tsx
import { cacheLife } from 'next/cache';

async function getCatalog() {
  'use cache';
  cacheLife('catalog');

  return db.product.findMany();
}
```

No inventes duraciones. Basa la política en:

- frecuencia de cambio;
- tolerancia a datos obsoletos;
- costo de consulta;
- requisitos del usuario;
- estrategia de invalidación.

---

## 21. Invalidación

### Cambio que el usuario debe ver inmediatamente

Desde una Server Action:

```tsx
'use server';

import { updateTag } from 'next/cache';

export async function updateProduct(id: string, formData: FormData) {
  await updateProductInDatabase(id, formData);
  updateTag(`product-${id}`);
  updateTag('products');
}
```

### Contenido que puede usar stale-while-revalidate

```tsx
'use server';

import { revalidateTag } from 'next/cache';

export async function publishPost() {
  await publishPostInDatabase();
  revalidateTag('posts', 'max');
}
```

### Regla

- `updateTag`: lectura inmediata después de escritura; solo Server Actions.
- `revalidateTag`: renovación en segundo plano; Server Actions o Route Handlers.
- `revalidatePath`: invalidación asociada a una ruta.

---

## 22. Datos de runtime y Suspense

No accedas a `cookies()`, `headers()` o `searchParams` dentro de un scope normal `use cache`.

Patrón recomendado:

```tsx
import { cookies } from 'next/headers';
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const theme = (await cookies()).get('theme')?.value;
  return <DashboardView theme={theme} />;
}
```

Para combinar sesión y caché, extrae el valor dinámico y pásalo a una función cacheada solo cuando sea seguro incluirlo en la clave.

Nunca caches secretos, tokens de sesión o datos sensibles sin evaluar aislamiento, almacenamiento y cardinalidad.

---

## 23. IO síncrono no determinista

Estas llamadas pueden impedir prerender:

- `Date.now()`
- `new Date()`
- `Math.random()`
- `crypto.randomUUID()`

Si deben ejecutarse por solicitud:

```tsx
import { connection } from 'next/server';

async function RequestTimeValue() {
  await connection();
  const id = crypto.randomUUID();

  return <span>{id}</span>;
}
```

Ubica ese componente detrás de Suspense o muévelo a un Client Component cuando corresponda.

No uses `instant = false` como sustituto de esta corrección.

---

## 24. Rutas dinámicas

### `generateStaticParams`

Con Cache Components, sigue la documentación instalada. La guía de migración de 16.3 indica que debe devolver al menos un parámetro cuando se usa para validar un shell estático.

No devuelvas un arreglo vacío esperando diferir todos los paths.

### `dynamicParams`

Retira:

```tsx
export const dynamicParams = false;
```

Si un parámetro no corresponde a datos reales:

```tsx
import { notFound } from 'next/navigation';

if (!record) {
  notFound();
}
```

### Esperar `params` dentro de Suspense

```tsx
import { Suspense } from 'react';

export default function Page({ params }: PageProps<'/blog/[slug]'>) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article params={params} />
    </Suspense>
  );
}

async function Article({ params }: Pick<PageProps<'/blog/[slug]'>, 'params'>) {
  const { slug } = await params;
  return <ArticleView slug={slug} />;
}
```

El objetivo es permitir que el shell se prerenderice sin esperar el valor dinámico.

---

## 25. Hooks de URL

Audita Client Components que usen:

- `usePathname`
- `useParams`
- `useSearchParams`
- `useSelectedLayoutSegment`
- `useSelectedLayoutSegments`

Empuja la lectura hacia el componente hoja más pequeño posible.

`useSearchParams` debe estar detrás de Suspense porque depende de datos conocidos en runtime.

No envuelvas toda la aplicación en Suspense cuando basta con envolver un pequeño componente.

---

## 26. Route Handlers GET

No apliques `use cache` directamente al export `GET`. Utiliza una función auxiliar:

```ts
import { cacheLife } from 'next/cache';

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

async function getProducts() {
  'use cache';
  cacheLife('hours');

  return db.product.findMany();
}
```

Revisa bloques `try/catch`: un bailout de prerender puede ser capturado accidentalmente y generar logs confusos.

---

## 27. Metadata

Si `generateMetadata` obtiene datos externos que pueden cachearse:

```tsx
export async function generateMetadata() {
  'use cache';

  const metadata = await getSiteMetadata();

  return {
    title: metadata.title,
    description: metadata.description,
  };
}
```

Si depende realmente de datos de la solicitud, consulta el patrón vigente en la documentación instalada. `generateMetadata` no se puede envolver directamente en Suspense.

No conviertas metadata global en dinámica sin necesidad.

---

## 28. Runtime Edge

Cache Components requiere runtime Node.js.

Retira en las rutas migradas:

```tsx
export const runtime = 'edge';
```

Si el proyecto necesita comportamiento en el borde:

- evalúa `proxy`;
- separa responsabilidades;
- conserva Edge únicamente donde la versión instalada lo permita;
- no combines una ruta Edge incompatible con Cache Components.

---

## 29. Estado de UI preservado

Con Cache Components, Next.js puede preservar rutas y estado usando React Activity.

Audita componentes que dependían del unmount para reiniciarse:

- dropdowns;
- popovers;
- modales;
- formularios;
- scroll;
- resultados de `useActionState`;
- efectos de inicialización.

Agrega reseteo explícito cuando corresponda.

Ejemplo conceptual:

```tsx
useLayoutEffect(() => {
  return () => {
    closePopover();
  };
}, []);
```

Prefiere derivar estado de navegación desde la URL cuando represente el estado real de la aplicación.

---

# PARTE V — INSTANT NAVIGATION Y PARTIAL PREFETCHING

## 30. Instant Navigation

Con Cache Components, Next.js valida durante desarrollo si las rutas pueden mostrar inmediatamente un shell útil.

El agente debe:

1. ejecutar `next dev`;
2. navegar por todas las rutas importantes;
3. revisar overlay, terminal y MCP;
4. localizar componentes bloqueantes;
5. decidir entre cachear, transmitir con Suspense u optar temporalmente por bloquear;
6. repetir hasta eliminar insights relevantes.

### Decisión por contenido

- **Cache:** contenido reutilizable.
- **Stream:** contenido dinámico que puede aparecer después del shell.
- **Block:** exclusión temporal mediante `instant = false`.

No conviertas datos en cacheables únicamente para hacer desaparecer un warning.

---

## 31. Activar Partial Prefetching

Partial Prefetching requiere Cache Components.

Después de terminar la migración:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
```

No lo actives antes de auditar:

- `<Link prefetch={true}>`;
- rutas con `params`;
- rutas con `searchParams`;
- contenido dependiente de URL;
- contenido en tiempo real;
- límites de Suspense.

---

## 32. Qué debe ocurrir con los enlaces

### Enlace normal

```tsx
<Link href="/products">Productos</Link>
```

Con Partial Prefetching, descarga el App Shell compartido de la ruta.

### `prefetch={false}`

Continúa deshabilitando prefetch.

### `prefetch={true}`

Se reserva para casos que necesitan precargar datos específicos de la URL mediante runtime prefetching.

No conserves `prefetch={true}` en todos los enlaces por costumbre.

### Tabla de decisión

| Destino                                         | Recomendación                                            |
| ----------------------------------------------- | -------------------------------------------------------- |
| completamente estático                          | quitar `prefetch={true}` redundante                      |
| datos ya cacheados                              | quitar `prefetch={true}`                                 |
| datos no cacheados pero reutilizables           | cachear y quitar `prefetch={true}`                       |
| datos de sesión                                 | cachear lookup seguro y revisar cardinalidad             |
| datos dependientes de `params` o `searchParams` | conservar solo si se implementa runtime prefetch         |
| datos en tiempo real                            | no prefetch; transmitir después de navegar               |
| listas enormes de enlaces                       | considerar `prefetch={false}` o estrategia por intención |

---

## 33. Adopción incremental de Partial Prefetching

Con el flag global todavía desactivado, una ruta puede adoptar el comportamiento individualmente:

```tsx
export const prefetch = 'partial';
```

Proceso:

1. elige una ruta;
2. audita todos los enlaces que apuntan a ella;
3. organiza datos URL detrás de Suspense;
4. agrega `prefetch = 'partial'`;
5. valida navegación;
6. despliega o prueba aisladamente;
7. repite;
8. activa `partialPrefetching: true` globalmente;
9. elimina exports redundantes.

Codemod final:

```bash
npx @next/codemod@canary remove-partial-prefetch ./app
```

Revisa siempre el diff.

---

## 34. Runtime Prefetching

Úsalo solamente cuando:

- el contenido depende de URL;
- la latencia después del clic es perceptible;
- existe alta probabilidad de navegación;
- el costo de precarga es razonable;
- los datos pueden cachearse correctamente.

No prefetches:

- información extremadamente volátil;
- endpoints costosos para miles de links;
- datos privados sin aislamiento;
- contenido que probablemente no será visitado.

La precarga es una optimización, no un requisito funcional.

---

## 35. Pruebas de navegación

Cubre al menos:

- navegación desde el menú principal;
- rutas dinámicas;
- navegación entre hermanos con layout compartido;
- back y forward;
- scroll preservado;
- formularios y modales preservados;
- enlaces con `prefetch={false}`;
- enlaces con `prefetch={true}`;
- rutas con cookies o headers;
- rutas con params y searchParams;
- navegación con red lenta;
- acceso directo mediante recarga.

Consulta y aplica las secciones oficiales:

- Validate Instant Navigation.
- Prevent regressions with E2E tests.

Si Playwright ya está instalado, agrega tests sin introducir sleeps arbitrarios. Usa estados visibles, navegación y respuestas reales.

---

# PARTE VI — FUNCIONES CONDICIONALES

## 36. Immutable Static Assets

Esta función está orientada principalmente a:

- adapters personalizados;
- plataformas de despliegue;
- self-hosting avanzado;
- CDN que conserva assets por hash entre despliegues.

No es una configuración general que toda aplicación deba activar.

Si el proyecto se despliega normalmente en Vercel y no implementa un adapter propio, no agregues código de adapter.

Al crear un adapter:

- declara soporte para assets inmutables;
- procesa `outputs.staticFiles[].immutableHash`;
- conserva assets antiguos mientras existan despliegues que los usen;
- sigue soportando assets no inmutables;
- valida colisiones y rotación de hash.

No elimines assets compartidos durante un despliegue progresivo.

---

## 37. Configuración recomendada por niveles

### Nivel A — actualización segura

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Conserva aquí únicamente configuraciones necesarias del proyecto.
};

export default nextConfig;
```

Turbopack no necesita un flag.

### Nivel B — después de migrar Cache Components

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

### Nivel C — después de auditar Partial Prefetching

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
```

### Nivel D — experimento de build, separado

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    turbopackMemoryEviction: 'auto',
  },
};

export default nextConfig;
```

No saltes directamente al Nivel D.

---

# PARTE VII — VALIDACIÓN

## 38. Scripts recomendados

Next.js 16 ya no debe depender de `next lint`.

Ejemplo:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test"
  }
}
```

Adapta tests al stack existente. No agregues Vitest o Playwright solamente para cambiar nombres de scripts si el proyecto usa otras herramientas.

---

## 39. Orden de validación

Ejecuta, en este orden:

```bash
npm run lint
```

```bash
npm run typecheck
```

```bash
npm test
```

```bash
npm run build
```

Adapta al gestor de paquetes.

Después:

```bash
npm run dev
```

Navega manualmente o mediante browser automation por las rutas críticas.

### Verificaciones adicionales

```bash
npx next typegen
```

```bash
npx tsc --noEmit
```

Revisa:

- consola del servidor;
- consola del navegador;
- overlay de Next.js;
- errores MCP;
- warnings de caché;
- errores de hidratación;
- rutas 404;
- metadata;
- imágenes;
- Server Actions;
- Route Handlers;
- autenticación;
- formularios;
- layouts;
- navegación.

---

## 40. Comparación de rendimiento

Antes y después, registra:

- tiempo de arranque de `next dev`;
- tiempo del primer build;
- tiempo de build caliente;
- memoria durante una sesión larga;
- número y peso total de prefetches;
- tiempo hasta mostrar App Shell;
- errores o insights de navegación;
- tamaño de bundles relevantes.

No declares una mejora sin mediciones.

Cuando compares caché de build:

- build frío: elimina `.next`;
- build caliente: conserva `.next`;
- usa el mismo entorno y variables;
- repite varias veces;
- registra mediana, no solo el mejor resultado.

---

## 41. Criterios de aceptación

La tarea se considera terminada solo si:

- [ ] El repositorio utiliza el gestor de paquetes original.
- [ ] No se perdieron cambios locales.
- [ ] Next.js está en una versión estable `16.3.x`.
- [ ] Node.js cumple los requisitos.
- [ ] El lockfile es coherente.
- [ ] El diff de dependencias fue revisado.
- [ ] `AGENTS.md` apunta a la documentación instalada.
- [ ] `.mcp.json` es válido si fue configurado.
- [ ] Turbopack funciona o la incompatibilidad está documentada.
- [ ] No quedan configuraciones antiguas incompatibles.
- [ ] Cache Components fue adoptado de manera controlada o se documentó por qué se pospone.
- [ ] Partial Prefetching solo se activó después de la auditoría.
- [ ] Los límites de Suspense son específicos.
- [ ] La caché no expone datos privados.
- [ ] La invalidación corresponde al comportamiento esperado.
- [ ] Las rutas críticas navegan correctamente.
- [ ] No hay errores de hidratación.
- [ ] Lint pasa.
- [ ] Typecheck pasa.
- [ ] Tests pasan.
- [ ] Build pasa.
- [ ] El informe final enumera cambios y riesgos.

---

## 42. Formato obligatorio del informe final del agente

```md
# Informe de implementación

## Resumen

- ...

## Versiones

- Node.js:
- Gestor:
- Next.js:
- React:
- TypeScript:

## Archivos modificados

- `ruta/archivo`: motivo.

## Dependencias

- Actualizadas:
- Agregadas:
- Eliminadas:
- Pospuestas:

## Configuración Next.js

- Turbopack:
- Cache Components:
- Partial Prefetching:
- React Compiler:
- TypeScript CLI:
- Flags experimentales:

## Migraciones realizadas

- ...

## Validaciones

- Lint:
- Typecheck:
- Tests:
- Build:
- Navegación:

## Riesgos o trabajo pendiente

- ...

## Recomendación

- ...
```

No afirmes que una validación pasó si no ejecutaste el comando correspondiente.

---

# PARTE VIII — PROMPTS LISTOS PARA USAR

## 43. Prompt maestro

```text
Lee completamente NEXTJS_16_3_AGENT_RUNBOOK.md y úsalo como plan operativo.

Analiza este repositorio local y actualízalo a la última versión estable de Next.js 16.3.x. Conserva el gestor de paquetes, el lockfile, la arquitectura y el comportamiento existentes.

Primero realiza la auditoría y presenta un plan breve basado en hallazgos reales. Después implementa las fases aplicables: actualización, AGENTS.md, MCP si está soportado, migraciones de Next.js 16, Turbopack, Cache Components y, solamente cuando Cache Components esté validado, Partial Prefetching.

No actives funciones experimentales sin una necesidad demostrada. No agregues NestJS si no existe. No actualices TypeScript 7 ni React Compiler dentro de la migración principal; trátalos como cambios separados.

Consulta siempre node_modules/next/dist/docs antes de aplicar APIs. Ejecuta lint, typecheck, tests y build. Al final entrega el informe con el formato definido en el runbook.
```

## 44. Prompt exclusivo para actualización

```text
Lee NEXTJS_16_3_AGENT_RUNBOOK.md. Ejecuta únicamente las fases de auditoría y actualización base a Next.js 16.3.x. No actives Cache Components, Partial Prefetching, TypeScript 7 ni React Compiler todavía. Usa el codemod oficial cuando corresponda, revisa el diff y ejecuta lint, typecheck, tests y build.
```

## 45. Prompt exclusivo para Cache Components

```text
Lee NEXTJS_16_3_AGENT_RUNBOOK.md. El proyecto ya está actualizado y validado en Next.js 16.3.x. Instala y utiliza next-cache-components-adoption. Migra incrementalmente una funcionalidad a la vez, usa instant = false solo como exclusión temporal y corrige cada insight mediante use cache, cacheLife, cacheTag, Suspense o connection según corresponda. No actives Partial Prefetching todavía.
```

## 46. Prompt exclusivo para Partial Prefetching

```text
Lee NEXTJS_16_3_AGENT_RUNBOOK.md. Cache Components ya está completamente adoptado y el build es correcto. Instala y utiliza next-partial-prefetching-adoption. Audita cada Link, params, searchParams, contenido URL, datos de sesión y tiempo real. Activa partialPrefetching solo después de completar la auditoría y valida las navegaciones críticas con E2E.
```

## 47. Prompt para experimentar con TypeScript 7

```text
Lee NEXTJS_16_3_AGENT_RUNBOOK.md. Crea un cambio aislado para evaluar TypeScript 7 con Next.js 16.3. No desactives useTypeScriptCli. Revisa compatibilidad de ESLint, tests, tipos, ORM y dependencias. Ejecuta typecheck, tests y build. Si hay incompatibilidades, revierte únicamente este experimento y documenta los bloqueos.
```

---

# PARTE IX — DOCUMENTACIÓN OFICIAL

## 48. Lanzamiento Next.js 16.3

- https://nextjs.org/blog/next-16-3
- https://nextjs.org/blog/next-16-3-ai-improvements
- https://nextjs.org/blog/next-16-3-turbopack
- https://nextjs.org/blog/next-16-3-instant-navigations

## 49. Actualización y agentes

- https://nextjs.org/docs/app/guides/upgrading/version-16
- https://nextjs.org/docs/app/guides/upgrading/codemods
- https://nextjs.org/docs/app/guides/ai-agents
- https://nextjs.org/docs/app/guides/mcp
- https://nextjs.org/docs/llms.txt
- https://nextjs.org/docs/sitemap.md

## 50. Cache Components

- https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents
- https://nextjs.org/docs/app/guides/migrating-to-cache-components
- https://nextjs.org/docs/app/api-reference/directives/use-cache
- https://nextjs.org/docs/app/api-reference/functions/cacheLife
- https://nextjs.org/docs/app/api-reference/functions/cacheTag
- https://nextjs.org/docs/app/api-reference/functions/updateTag
- https://nextjs.org/docs/app/api-reference/functions/revalidateTag
- https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheLife
- https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers
- https://nextjs.org/docs/app/guides/incremental-static-regeneration-cache-components
- https://nextjs.org/docs/app/guides/preserving-ui-state
- https://github.com/vercel/next.js/tree/canary/skills/next-cache-components-adoption

## 51. Navegación y prefetch

- https://nextjs.org/docs/app/guides/instant-navigation
- https://nextjs.org/docs/app/guides/instant-navigation#validate-instant-navigation
- https://nextjs.org/docs/app/guides/instant-navigation#prevent-regressions-with-e2e-tests
- https://nextjs.org/docs/app/guides/adopting-partial-prefetching
- https://nextjs.org/docs/app/guides/runtime-prefetching
- https://nextjs.org/docs/app/api-reference/config/next-config-js/partialPrefetching
- https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/instant
- https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/prefetch
- https://nextjs.org/docs/app/api-reference/components/link
- https://github.com/vercel/next.js/tree/canary/skills/next-partial-prefetching-adoption

## 52. Turbopack

- https://nextjs.org/docs/app/api-reference/turbopack
- https://nextjs.org/docs/app/api-reference/turbopack#importmetaglob
- https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
- https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache
- https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackMemoryEviction

## 53. TypeScript y React Compiler

- https://nextjs.org/docs/app/api-reference/config/typescript
- https://nextjs.org/docs/app/api-reference/config/next-config-js/useTypeScriptCli
- https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler
- https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/

## 54. Adapters y assets

- https://nextjs.org/docs/app/api-reference/config/next-config-js/adapterPath
- https://nextjs.org/docs/app/api-reference/adapters/immutable-static-assets
- https://nextjs.org/docs/app/api-reference/config/next-config-js/supportsImmutableAssets

---

# 55. Nota final para el agente

Next.js 16.3 ofrece mejoras importantes, pero no todas requieren configuración manual.

Aplica esta prioridad:

1. versión estable y seguridad;
2. documentación versionada para agentes;
3. migraciones obligatorias;
4. Turbopack predeterminado;
5. Cache Components incremental;
6. Instant Navigation;
7. Partial Prefetching;
8. optimizaciones opcionales medidas;
9. experimentos separados.

La mejor configuración no es la que activa más flags, sino la que mantiene el proyecto correcto, medible, mantenible y compatible con producción.
