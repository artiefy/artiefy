# Guía de Actualización a **Next.js 16** (de 15.x → 16)

Última revisión: 21 de octubre de 2025

Esta guía resume y **ordena** los cambios de Next.js 16 respecto a 15.x, con **checklists**, **snippet-ready**, y **pasos de migración** para que puedas aplicarlos en tus proyectos y para que tu **AI Agent (VS Code / MCP / GPT Codex)** entienda **qué cambios realizar**.

## 🆕 Novedades oficiales (Next.js 16)

**Publicado:** 21 Oct 2025 (previo a Next.js Conf 2025).  
**Autores:** Jimmy Lai (@feedthejim), Josh Story (@joshcstory), Sebastian Markbåge (@sebmarkbage), Tim Neutkens (@timneutkens).

### Añadido respecto a la beta anterior

- **Cache Components**: nuevo modelo de caché basado en **PPR** y la directiva **"use cache"** para navegación instantánea.
- **Next.js DevTools MCP**: integración **Model Context Protocol** para debugging asistido por IA, con conocimiento de Next.js, logs unificados, acceso automático a errores y _page awareness_.
- **`proxy.ts` (antes `middleware.ts`)**: hace explícita la frontera de red; **runtime Node**. `middleware` queda deprecado (solo para Edge, se removerá en el futuro).
- **DX / Logging**: mejoras de _dev request logs_ (tiempos **Compile**/**Render**) y de _build output_ con tiempos por etapa.

### Ya disponible desde la beta (recordatorio)

- **Turbopack** **estable** y por defecto (hasta **5–10×** Fast Refresh y **2–5×** builds).
- **Turbopack File System Caching** (**beta**) para arranques y recompilaciones más rápidas.
- **React Compiler** **estable** (opt‑in, requiere `babel-plugin-react-compiler`).
- **Build Adapters API** (**alpha**).
- **Enrutamiento mejorado**: deduplicación de _layouts_ e **incremental prefetching**.
- **APIs de caché**: **nuevo** `updateTag()` y `revalidateTag(tag, profile)` refinado.
- **React 19.2**: _View Transitions_, `useEffectEvent()`, `<Activity/>`.
- **Breaking changes**: `params/searchParams` **async**, cambios por defecto en `next/image`, etc.

> Para pasos de migración y _search & replace_ automatizable, ver secciones **Checklist**, **Breaking changes** y **Migración paso a paso** más abajo.

---

## ⚡ TL;DR — Checklist Rápida de Migración

- [ ] **Node.js ≥ 20.9**, **TypeScript ≥ 5.1**, navegadores modernos (Chrome/Edge/Firefox 111+, Safari 16.4+).
- [ ] Ejecuta el **codemod**: `npx @next/codemod@canary upgrade latest`.
- [ ] Actualiza paquetes: `npm i next@latest react@latest react-dom@latest` (+ `@types/react*` si usas TS).
- [ ] **Turbopack por defecto**: quita `--turbopack` de scripts; si necesitas Webpack usa `--webpack`.
- [ ] **middleware → proxy** (Node runtime): renombra `middleware.(ts|js)` a `proxy.(ts|js)` y `middleware()` a `proxy()`.
- [ ] **APIs dinámicas asíncronas**: reemplaza **todas** las lecturas **sync** de `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` por **await**.
- [ ] **PPR → Cache Components**: habilita `cacheComponents: true` en `next.config.*` y usa `"use cache"` cuando aplique.
- [ ] **Caching APIs**: usa `revalidateTag(tag, 'max')` (o perfiles) y **nuevo** `updateTag(tag)` (Actions) + `refresh()`.
- [ ] **next/image**: revisa **localPatterns.search** para **query strings**, `qualities` ahora solo `[75]`, `imageSizes` sin `16`, `maximumRedirects` por defecto `3`, `dangerouslyAllowLocalIP` bloqueado (actívalo solo en redes privadas).
- [ ] **Deprecaciones/Remociones**: AMP eliminado, `next lint` eliminado (usa ESLint/Biome), `serverRuntimeConfig/publicRuntimeConfig` eliminados (usa `.env`), experimental flags renombrados o removidos.
- [ ] **Paralell routes**: todos los _slots_ requieren `default.(ts|tsx)`.
- [ ] **Sass imports**: elimina `~` en `@import` desde `node_modules` o usa `turbopack.resolveAlias`.
- [ ] **Scroll behavior**: si quieres el override antiguo, añade `data-scroll-behavior="smooth"` en `<html>`.
- [ ] (Opcional) **React Compiler**: `reactCompiler: true` + `babel-plugin-react-compiler`.
- [ ] (Opcional) **Next DevTools MCP**: integra servidor MCP para upgrades y debugging con IA.

---

## 1) Requisitos de versión

- **Node.js**: ≥ **20.9.0** (LTS). Node 18 **no** soportado.
- **TypeScript**: ≥ **5.1.0**.
- **Navegadores**: Chrome/Edge/Firefox **111+**, Safari **16.4+**.

---

## 2) Actualización rápida

### Con codemod

```bash
npx @next/codemod@canary upgrade latest
```

### Manual

```bash
npm install next@latest react@latest react-dom@latest
# Si usas TS también:
npm install -D @types/react@latest @types/react-dom@latest
```

---

## 3) Turbopack por defecto (dev y build)

- **Ya no** necesitas `--turbopack` en los scripts.
- Si tienes **configuración Webpack** personalizada y corres `next build` (ahora Turbopack por defecto), el build **fallará** para evitar misconfigs. Opciones:
  - **Seguir con Turbopack** ignorando Webpack: `next build --turbopack`.
  - **Migrar a Turbopack** (recomendado): mueve opciones a `nextConfig.turbopack`.
  - **Mantener Webpack**: usa `--webpack`.

**Scripts sugeridos:**

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
  },
}
```

**Ubicación de config:** `experimental.turbopack` pasa a **top-level** `turbopack`:

```ts
// Next.js 16
const nextConfig: import('next').NextConfig = {
  turbopack: {
    // opciones
    // p.ej. resolveAlias para neutralizar módulos Node en el browser:
    resolveAlias: {
      fs: { browser: './empty.ts' }, // Preferible refactorizar imports antes
    },
  },
};
export default nextConfig;
```

**Filesystem cache (dev, beta):**

```ts
const nextConfig = {
  experimental: { turbopackFileSystemCacheForDev: true },
};
export default nextConfig;
```

**Notas Sass desde node_modules (sin `~`):**

```scss
// Antes (Webpack)
@import '~bootstrap/dist/css/bootstrap.min.css';
// Ahora (Turbopack)
@import 'bootstrap/dist/css/bootstrap.min.css';
```

Si no puedes cambiar imports, usa:

```ts
turbopack: {
  resolveAlias: { '~*': '*' }
}
```

---

## 4) Cache Components + PPR

**Nuevo modelo** de caché **opt‑in** con `"use cache"` y `cacheComponents: true`. Completa el flujo de **Partial Pre‑Rendering (PPR)**.

```ts
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};
export default nextConfig;
```

- La caché ya **no es implícita**: todo lo dinámico se ejecuta a **request time** por defecto.
- El flag `experimental.ppr` y variantes fueron **removidos** a favor de este modelo.

---

## 5) Next.js DevTools MCP (IA + MCP)

Integra **Model Context Protocol** para **debugging asistido por IA** (rutas, caché, logs unificados, stack traces, awareness de página).

**Ejemplo de configuración MCP del cliente:**

```jsonc
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"],
    },
  },
}
```

Prompts útiles:

- “**Next Devtools, help me upgrade my Next.js app to version 16**”
- “**Next Devtools, migrate my Next.js app to cache components**”

---

## 6) `middleware` → **`proxy`** (red de app explícita)

- Renombra `middleware.(ts|js)` a **`proxy.(ts|js)`**.
- Renombra la función exportada a **`proxy`**. **Runtime** fijo: **Node.js**.
- **Edge**: `middleware` aún disponible **solo** para casos Edge, **deprecado** y se removerá en una futura versión.

```ts
// proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}
```

**Flags renombrados** (ejemplo):

```ts
// next.config.ts
export default {
  skipProxyUrlNormalize: true, // antes: skipMiddlewareUrlNormalize
};
```

---

## 7) Logging y Salidas de build/dev

- Logs de **dev requests** ahora detallan: **Compile** (routing/compilación) y **Render** (tu código/React).
- **Build steps** muestran tiempos por etapa.
- **Salidas separadas**: `next dev` usa `.next/dev`. Existe lockfile para evitar instancias duplicadas.
- **Tracing Turbopack** en dev:

```bash
npx next internal trace .next/dev/trace-turbopack
```

---

## 8) Enrutamiento y navegación mejorados

- **Layout deduplication** al prefetch de múltiples URLs con layout compartido.
- **Incremental prefetching**: se prefetchan **partes** que faltan, no páginas completas.
- Puede aumentar el **número** de requests, pero baja el **peso total** transferido.

**Sin cambios de código** requeridos. Funciona con **Cache Components**.

---

## 9) Caching APIs (estables y nuevas)

### `revalidateTag(tag, profile)` (actualizado)

- Requiere **2º argumento**: un **perfil `cacheLife`** (`'max'`, `'hours'`, `'days'`) o un objeto `{ revalidate: 3600 }`.

```ts
import { revalidateTag } from 'next/cache';

revalidateTag('blog-posts', 'max'); // SWR recomendado
revalidateTag('news-feed', 'hours');
revalidateTag('analytics', { revalidate: 3600 });
```

Úsalo cuando toleras **SWR**: usuarios ven caché inmediata mientras se revalida en background.

### `updateTag(tag)` (nuevo, **Server Actions**)

- **Read-your-writes**: invalida y **lee fresco** en la misma request (ideal para formularios/perfiles).

```ts
'use server';
import { updateTag } from 'next/cache';

export async function updateUserProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile);
  updateTag(`user-${userId}`); // UI refleja el cambio al instante
}
```

### `refresh()` (nuevo, **Server Actions**)

- Refresca **datos no cacheados** en la UI (complementa `router.refresh()` del cliente).

```ts
'use server';
import { refresh } from 'next/cache';

export async function markNotificationAsRead(id: string) {
  await db.notifications.markAsRead(id);
  refresh(); // Actualiza contadores/indicadores no cacheados
}
```

### `cacheLife` y `cacheTag` (estables)

- Sin `unstable_`:

```ts
import { cacheLife, cacheTag } from 'next/cache';
```

---

## 10) **Breaking changes** importantes

### 10.1 Async **Request APIs**

- Solo **asíncrono**: `cookies()`, `headers()`, `draftMode()` y **params/searchParams** en `layout/page/route/default` y generadores de imágenes.
- Usa el **codemod** para migrar a **async**. Para tipos: `npx next typegen`.

**Ejemplo (Page con tipos generados):**

```ts
// /app/blog/[slug]/page.tsx
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params
  const query = await props.searchParams
  return <h1>Blog Post: {slug}</h1>
}
```

**Imágenes OG/Twitter/Icon (params e id async):**

```ts
// /app/shop/[slug]/opengraph-image.ts
export async function generateImageMetadata({ params }) {
  const { slug } = await params;
  return [{ id: '1' }, { id: '2' }];
}

export default async function Image({ params, id }) {
  const { slug } = await params;
  const imageId = await id; // Promise<string>
  // ...
}
```

### 10.2 `next/image` cambios por defecto

- **Query strings locales** requieren `images.localPatterns.search` para evitar enumeration attacks.
- `images.minimumCacheTTL`: **60s → 4h (14400s)**.
- `images.imageSizes`: se **remueve** `16`. Añádelo si lo necesitas.
- `images.qualities`: por defecto solo **[75]** (otros valores se **ajustan** al más cercano).
- `images.dangerouslyAllowLocalIP`: bloqueado por defecto (actívalo **solo** en redes privadas).
- `images.maximumRedirects`: por defecto **3**.

**Snippets:**

```ts
// Local images con query strings
images: {
  localPatterns: [{ pathname: '/assets/**', search: '?v=1' }];
}

// Restaurar TTL corto
images: {
  minimumCacheTTL: 60;
}

// Volver a incluir 16px
images: {
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384];
}

// Múltiples calidades
images: {
  qualities: [50, 75, 100];
}

// (Solo redes privadas) permitir IP local
images: {
  dangerouslyAllowLocalIP: true;
}

// Redirecciones
images: {
  maximumRedirects: 5;
} // o 0 para desactivar
```

---

## 11) Deprecaciones y Remociones

### 11.1 Removidos

| **Eliminado**                                     | **Reemplazo/Acción**                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **AMP** (`useAmp`, `config.amp`)                  | Eliminar. Usa optimizaciones modernas de Next.js.                                                       |
| **`next lint`** y `eslint` en config              | Usa **ESLint** (Flat Config) o **Biome**. Codemod: `npx @next/codemod@canary next-lint-to-eslint-cli .` |
| **`serverRuntimeConfig` / `publicRuntimeConfig`** | Usa **variables de entorno** (`process.env` / `NEXT_PUBLIC_*`). Considera `connection()` y `taint`.     |
| `experimental.turbopack`                          | Mover a **`turbopack`** top-level.                                                                      |
| `experimental.dynamicIO`                          | Renombrado a **`cacheComponents`**.                                                                     |
| `experimental.ppr` / `experimental_ppr` por ruta  | Removidos. Usa **Cache Components**.                                                                    |
| `unstable_rootParams()`                           | API alternativa llegará en una **minor**.                                                               |
| Override automático de `scroll-behavior: smooth`  | Añade `data-scroll-behavior="smooth"` en `<html>` para el comportamiento anterior.                      |
| Métricas “First Load JS / size” en build          | Medir con Lighthouse/Vercel Analytics (RSC/server-driven).                                              |

### 11.2 Deprecados (se removerán en futuras versiones)

- **`middleware.ts`** (Edge-only): migra a **`proxy.ts`** (Node runtime) para interceptación general.
- **`next/legacy/image`** → usa **`next/image`**.
- **`images.domains`** → usa **`images.remotePatterns`**.
- `revalidateTag(tag)` **sin** 2º parámetro → usa `revalidateTag(tag, profile)` o `updateTag(tag)` en Actions.

---

## 12) Otras mejoras

- **React 19.2** (App Router con React Canary): View Transitions, `useEffectEvent()`, `<Activity />`.
- **React Compiler** **estable** (no default): `reactCompiler: true` + `babel-plugin-react-compiler` (compilación más lenta).
- **create-next-app** simplificado (TS-first, Tailwind, ESLint).
- **Build Adapters API** (alpha): `experimental.adapterPath = require.resolve('./my-adapter.js')`.
- **Babel en Turbopack**: se **habilita automáticamente** si hay config Babel (antes era error duro).
- **Dev/Build concurrentes**: directorios de salida separados; lockfile anti-doble ejecución.
- **Modern Sass API** (sass-loader v16).

---

## 13) Migración paso a paso (detallada)

### Paso 0 — Pre‑flight

- Crea rama de migración. Habilita CI.
- Asegura **Node 20.9+** y **TS 5.1+**.
- Revisa herramientas de lint/test/format.

### Paso 1 — Codemod & paquetes

```bash
npx @next/codemod@canary upgrade latest
npm i next@latest react@latest react-dom@latest
# TS:
npm i -D @types/react@latest @types/react-dom@latest
```

Si usabas `next lint`, migra a ESLint CLI o Biome:

```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

### Paso 2 — `next.config.*`

- Mueve `experimental.turbopack` → `turbopack` top-level.
- Elimina `experimental.dynamicIO`; añade `cacheComponents: true` si usarás Cache Components.
- (Opcional) `reactCompiler: true` + `npm i -D babel-plugin-react-compiler`.
- Renombra flags con _middleware_ en el nombre → _proxy_ (p. ej. `skipProxyUrlNormalize`).
- (Opcional) `experimental.turbopackFileSystemCacheForDev: true`.

### Paso 3 — **middleware → proxy**

- Renombra archivo y función a `proxy` (Node runtime).
- Mantén `middleware` **solo** si usas **Edge** (deprecado).

### Paso 4 — **Async Request APIs**

- Reemplaza **todos** los usos **sync** de: `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` por su versión **await**.
- Ejecuta `npx next typegen` y usa los **helpers de tipos** (`PageProps`, `LayoutProps`, `RouteContext`).

### Paso 5 — Generadores de imágenes

- Cambia a **async** en `opengraph-image`, `twitter-image`, `icon`, `apple-icon` (incluye `id: Promise<string>`).

### Paso 6 — **Caching APIs**

- Reescribe `revalidateTag(tag)` → `revalidateTag(tag, 'max')` (o perfil/objeto).
- Usa **`updateTag(tag)`** en **Server Actions** para read‑your‑writes.
- Usa **`refresh()`** en **Server Actions** para refrescar datos no cacheados.

### Paso 7 — **next/image**

- Si usas **query strings** en **local src**, añade `images.localPatterns.search`.
- Ajusta `minimumCacheTTL`, `imageSizes`, `qualities`, `dangerouslyAllowLocalIP`, `maximumRedirects` según tu caso.
- Cambia `next/legacy/image` → `next/image` y `images.domains` → `images.remotePatterns`.

### Paso 8 — **Turbopack**

- Quita `--turbopack` de scripts (ya es default).
- Si tienes **Webpack personalizado**:
  - Para seguir con Webpack: `next build --webpack`.
  - Para migrar: mueve opciones a `turbopack` y revisa `resolveAlias` (p. ej. `fs` en browser).
- Corrige imports Sass con `~`.

### Paso 9 — **Parallel routes**

- Añade `default.(ts|tsx)` en **todos** los _slots_ paralelos. Usa `notFound()` o `return null` si aplica.

### Paso 10 — **Scroll behavior**

- Si quieres el override antiguo, añade: `<html data-scroll-behavior="smooth">`.

### Paso 11 — **Runtime config**

- Elimina `serverRuntimeConfig/publicRuntimeConfig`.
- Usa variables de entorno:
  - Servidor: `process.env.*` en **Server Components**.
  - Cliente: `NEXT_PUBLIC_*`.
- Para leer en **runtime** (no bundle): `await connection()` antes de `process.env`.
- Considera **`taint` API** para evitar filtrar secretos a Client Components.

### Paso 12 — **Dev/Build**

- Ten en cuenta `.next/dev` y el **lockfile**. Actualiza tooling (p. ej. paths de tracing).

### Paso 13 — (Opcional) **React Compiler**

- Activa `reactCompiler: true` y añade `babel-plugin-react-compiler`. Espera builds dev más lentos.

### Paso 14 — (Opcional) **Next DevTools MCP**

- Configura servidor MCP y usa prompts para automatizar parte de la migración con IA.

---

## 14) Snippets útiles

**`proxy.ts` básico**

```ts
import { NextRequest, NextResponse } from 'next/server';

export default function proxy(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}
```

**`next.config.ts` (plantilla 16)**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true, // Nuevo modelo de caché (opt‑in)
  turbopack: {
    // resolveAlias, debugIds, loader conditions, etc.
  },
  images: {
    // Ajusta según tus necesidades de 16.x
    // minimumCacheTTL: 60,
    // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // qualities: [50, 75, 100],
    // maximumRedirects: 3,
    // dangerouslyAllowLocalIP: false,
    // localPatterns: [{ pathname: '/assets/**', search: '?v=1' }],
    // remotePatterns: [{ protocol: 'https', hostname: 'example.com' }],
  },
  // skipProxyUrlNormalize: true,
  // reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};
export default nextConfig;
```

**Server Action con `updateTag` + `refresh`**

```ts
'use server';
import { updateTag, refresh } from 'next/cache';

export async function updateProfile(userId: string, profile: Profile) {
  await db.users.update(userId, profile);
  updateTag(`user-${userId}`); // read-your-writes
  refresh(); // refresca partes no cacheadas (p.ej. contador en header)
}
```

### Tipos para async params/searchParams

```bash
npx next typegen
```

```ts
export default async function Page(props: PageProps<'/blog/[slug]'>) {
  const { slug } = await props.params;
  const query = await props.searchParams;
  // ...
}
```

### Habilitar React Compiler

```ts
const nextConfig = { reactCompiler: true };
export default nextConfig;
```

```bash
npm i -D babel-plugin-react-compiler
```

### HTML con scroll behavior anterior

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
```

---

## 15) Diagnóstico rápido (errores comunes)

- **“Module not found: Can't resolve 'fs'” en cliente** → Evita importar módulos Node en bundles cliente. Temporalmente: `turbopack.resolveAlias.fs.browser = './empty.ts'`.
- **Falla build por Webpack detectado** → Usa `--webpack` si sigues en Webpack o migra config a `turbopack`.
- **Imports Sass con `~`** → elimínalo o usa alias `{'~*':'*'}`.
- **Sync `cookies()/headers()/draftMode()/params/searchParams`** → migra a **async** y ejecuta `npx next typegen`.
- **Rutas paralelas** sin `default` → añade `default.tsx` que haga `notFound()` o `return null`.
- **Imágenes locales con query** sin `localPatterns.search` → agrega patrón en `images.localPatterns`.
- **Cambios de calidad/tamaños** en imágenes no aplican → define `images.qualities` o `images.imageSizes` explícitamente.
- **Edge middleware** que dejó de funcionar en `proxy` → `proxy` es **Node**, mantén `middleware` solo para Edge (deprecado).

---

## 16) Referencia de _Search & Replace_ (para agentes/automatización)

- **Archivos**: busca `middleware.(ts|js)` → renombra a `proxy.(ts|js)`; reemplaza `export (default)? function middleware` → `proxy`.
- **Config**: `experimental.turbopack` → `turbopack` (top-level).
- **Config**: eliminar `experimental.dynamicIO`; añadir `cacheComponents: true` si aplicará.
- **Config**: renombrar flags `*Middleware*` → `*Proxy*` (p.ej. `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`).
- **Código**:
  - Reemplazar usos **sync** de `cookies()`, `headers()`, `draftMode()`, `params`, `searchParams` por `await`.
  - Actualizar `revalidateTag(tag)` → `revalidateTag(tag, 'max')` o `{ revalidate: N }`.
  - Sustituir `next/legacy/image` → `next/image`.
  - `images.domains` → `images.remotePatterns`.
  - Añadir `images.localPatterns.search` si hay query strings locales.
  - Añadir `default.(ts|tsx)` a _parallel route slots_ faltantes.

---

## 17) Notas finales

- **Medición de performance**: usa Lighthouse o Vercel Analytics (Core Web Vitals) en lugar de First Load JS.
- **Concurrencia dev/build**: `.next/dev` y lockfile ya incluidos; ajusta tooling CI/Local si interactúan con `.next`.
- **Mantente en 15.x canary** si dependes de la PPR canaria antigua; habrá guía de migración a Cache Components.

---

**Hecho con ❤️ para migrar tus apps a Next.js 16 de forma segura y rápida.**

---

## 📌 Notas extra (paridad con anuncio oficial)

- **AI Agents con Next DevTools MCP** (config y prompts) ya incluidos en esta guía (ver sección Next.js DevTools MCP).

- **Codemod de upgrade** y **capacidades** cubiertos (ver Actualización rápida y Migración paso a paso).

- **Turbopack por defecto** y **opciones para Webpack** (opt‑out con `--webpack`) incluidas, con ejemplos de `package.json`.

- **Ubicación de configuración de Turbopack** de `experimental.turbopack` → `turbopack` (top-level) cubierta, con ejemplos y notas
  de `resolveAlias` (fallback `fs`) y **import de Sass** sin `~` (alias `{'~*':'*'}` si es necesario).

- **Filesystem cache (dev)** para Turbopack está documentado (flag experimental).

- **Async Request APIs** y **typegen** (`npx next typegen`) incluidos, con ejemplos de
  `params/searchParams` y generadores de imágenes (Open Graph / Twitter / icon / apple-icon).

- **Caching APIs** (`revalidateTag(tag, profile)`, `updateTag`, `refresh`) con ejemplos listos para copiar.

- **PPR**: flags experimentales removidos, ahora con **Cache Components** (`cacheComponents: true`).

- **Migración middleware → proxy** (Node runtime) con **comandos**:

  ```bash
  mv middleware.ts proxy.ts
  # o
  mv middleware.js proxy.js
  ```

  Flags renombrados (`skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`).

- **next/image**: cambios por defecto (TTL 4h, `imageSizes` sin 16, `qualities`=[75], `maximumRedirects`=3, restricción a IP local),
  **`images.localPatterns.search`** para _query strings_, `next/legacy/image` deprecado, `images.domains` deprecado (usa `remotePatterns`).

- **Dev/Build concurrentes**: salida separada `.next/dev` + **tracing**:

  ```bash
  npx next internal trace .next/dev/trace-turbopack
  ```

- **Parallel Routes**: `default.(ts|tsx)` requerido para _slots_ (usar `notFound()` o `return null`).

- **ESLint Flat Config**: `@next/eslint-plugin-next` se alinea con **ESLint v10** (formato Flat). Si usas `.eslintrc`, migra a Flat Config.

- **Scroll Behavior Override**: añade `data-scroll-behavior="smooth"` en `<html>` para volver al comportamiento anterior.

- **Métricas removidas** del build (First Load JS/size): usa Lighthouse o Vercel Analytics (Core Web Vitals).

- **Carga de config en `next dev`**: ya **no** se carga dos veces. `process.argv.includes('dev')` en `next.config.*` **puede ser `false`**.
  Usa `NODE_ENV === 'development'` o **phase** para condicionar lógica de desarrollo.

- **Node.js native TypeScript para `next.config.ts`**: puedes ejecutar con
  `--experimental-next-config-strip-types` en `next dev|build|start`.

- **Build Adapters API (alpha)** y **Modern Sass API** (sass‑loader v16) incluidas.

- **Removals**: AMP (incluye `useAmp`, `config.amp`), `next lint` (usa ESLint/Biome y codemod), runtime config (`serverRuntimeConfig`/`publicRuntimeConfig` → `.env` + `connection()` + `NEXT_PUBLIC_*` + `taint`), `unstable_rootParams`.
