# Guía optimizada de SWR para Next.js

Esta guía compacta reúne patrones y ejemplos recomendados para usar SWR en proyectos Next.js (App Router). Está enfocada en prácticas útiles para equipos que migran o mantienen aplicaciones modernas.

## Instalación

```bash
pnpm add swr
# o
npm install swr
# o
yarn add swr
```

## Quick start — fetcher y uso básico

```ts
import useSWR from 'swr'

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then(res => res.json())

function Profile({ userId }: { userId: string }) {
  const { data, error, isLoading } = useSWR(`/api/user/${userId}`, fetcher)
  if (error) return <div>failed to load</div>
  if (isLoading) return <div>loading...</div>
  return <div>hello {data.name}!</div>
}
```

Estados comunes: loading, ready y error. Usa `data`, `error` e `isLoading` para decidir la UI.

## Hooks reutilizables

```ts
function useUser(id: string) {
  const { data, error, isLoading } = useSWR(`/api/user/${id}`, fetcher);
  return { user: data, isLoading, isError: error };
}
```

La reutilización facilita tests y compartición de datos; SWR deduplica requests con la misma clave.

## SWRConfig global (provider cliente)

Crea un provider cliente para opciones globales (fetcher, refreshInterval, fallback, provider, etc.).

```tsx
'use client';
import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, refreshInterval: 3000 }}>{children}</SWRConfig>
  );
}
```

En App Router, coloca este provider en un layout cliente o en un componente marcado con `'use client'`.

## Integración con Next.js (App Router y Server Components)

- No importes `useSWR` ni hooks cliente dentro de Server Components. Solo utilidades de serialización (p. ej. `unstable_serialize`) son seguras en RSC.
- Patrón recomendado: obtener datos en el servidor (SSG/SSR) y pasar `fallback` al provider cliente para hidratar el cache.

Ejemplo (SSG -> fallback):

```ts
// getStaticProps (páginas) o fetch en Server Component
export async function getStaticProps() {
  const article = await getArticleFromAPI()
  return {
    props: {
      fallback: {
        '/api/article': article,
      },
    },
  }
}

// Cliente: envolvemos con SWRConfig
'use client'
import { SWRConfig } from 'swr'

export default function Page({ fallback, children }: any) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>
}
```

Para keys complejas (arrays/objetos) serializa en el servidor con `unstable_serialize` y úsalo en `fallback`.

## Paginación e infinite loading — useSWRInfinite

```ts
import useSWRInfinite from 'swr/infinite';

const getKey = (pageIndex: number, previousPageData: any) => {
  if (previousPageData && !previousPageData.length) return null; // reached the end
  return `/users?page=${pageIndex}&limit=10`;
};

function App() {
  const { data, size, setSize } = useSWRInfinite(getKey, fetcher);
  // data es un array con cada página
}
```

Opciones útiles: `initialSize`, `parallel` (para fetch en paralelo), `revalidateAll`, `persistSize`. Para revalidar globalmente usa `unstable_serialize(getKey)` + `mutate`.

## Mutaciones — mutate y useSWRMutation

- `mutate(key, data?, options?)` actualiza cache y/o fuerza revalidación.
- `useSWRMutation` es para llamadas manuales (POST/PUT) y soporta `optimisticData`, `rollbackOnError`, `populateCache`.

Ejemplo (optimistic update):

```tsx
import useSWR, { useSWRConfig } from 'swr';

function Profile() {
  const { data } = useSWR('/api/user', fetcher);
  const { mutate } = useSWRConfig();

  const onClick = async () => {
    const newName = data.name.toUpperCase();
    await mutate('/api/user', async () => updateUserName(newName), {
      optimisticData: { ...data, name: newName },
      rollbackOnError: true,
    });
  };
}
```

`useSWRMutation` expone `trigger(arg)` y `isMutating` para llamadas controladas desde la UI.

## Suscripciones en tiempo real — useSWRSubscription

```ts
import useSWRSubscription from 'swr/subscription'

function Post({ id }: { id: string }) {
  const { data } = useSWRSubscription(['views', id], ([, postId], { next }) => {
    const socket = new WebSocket(`wss://.../${postId}`)
    socket.onmessage = (e) => next(null, JSON.parse(e.data))
    return () => socket.close()
  })
  return <span>{data?.views ?? 0} views</span>
}
```

Las suscripciones se deduplican por key: múltiples consumidores comparten la misma suscripción.

## Prefetching y preload

- Preload nativo (head):

```html
<link rel="preload" href="/api/data" as="fetch" crossorigin="anonymous" />
```

- Prefetch programático con `preload(key, fetcher)` para iniciar requests antes de renderizar.

## Suspense

- `suspense: true` permite usar SWR con React Suspense. En SSR requiere `fallback`/`fallbackData` para evitar datos ausentes.
- Evita waterfalls: usa `preload` cuando combines Suspense con múltiples hooks.

## Manejo de errores y retry

Si el fetcher lanza, el error aparecerá en `error`. Adjunta `status`/`info` cuando el API lo devuelva:

```ts
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err: any = new Error('An error occurred while fetching the data.');
    err.info = await res.json().catch(() => null);
    err.status = res.status;
    throw err;
  }
  return res.json();
};
```

`onErrorRetry` permite controlar reintentos (p. ej. no reintentar 404).

## Opciones comunes (resumen)

- `dedupingInterval` (ms)
- `focusThrottleInterval` (ms)
- `revalidateOnFocus`, `revalidateOnReconnect`
- `refreshInterval` (polling)
- `fallback`, `fallbackData`
- `keepPreviousData`
- `compare` (custom comparator)

## TypeScript

- `useSWR<Data, Error>(key, fetcher)` y tipos específicos para `useSWRInfinite` / `useSWRSubscription`.
- Puedes declarar `Fetcher<T, K>` y tipos para middleware para mejorar seguridad.

## Middleware y provider

- `use` acepta middlewares: `useSWR(key, fetcher, { use: [myMiddleware] })`.
- Provider: `provider: () => new Map()` es útil para tests o entornos controlados.

## Recursos

- Documentación oficial: [SWR docs](https://swr.vercel.app)

---
