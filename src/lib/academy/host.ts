// Resolución de la academia a partir del host (ponao.artiefy.com → "ponao").
// Sin dependencias de BD ni de env: lo usa el middleware (src/proxy.ts).

// Dominios raíz bajo los que vive una academia. En local se prueba con
// <slug>.localhost:3000 (los navegadores resuelven *.localhost a 127.0.0.1).
const DOMINIOS_RAIZ = ['artiefy.com', 'localhost'] as const;

// Subdominios que nunca son academias (infraestructura y Artiefy mismo).
export const SUBDOMINIOS_RESERVADOS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'accounts',
  'clerk',
  'mail',
  'artiefy',
  'dashboard',
  'static',
  'cdn',
  'assets',
  'blog',
  'help',
  'soporte',
  'status',
]);

// 3 a 40 caracteres: minúsculas, números y guiones (no al inicio ni al final).
export const SLUG_ACADEMIA_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function esSlugAcademiaValido(slug: string): boolean {
  return SLUG_ACADEMIA_RE.test(slug) && !SUBDOMINIOS_RESERVADOS.has(slug);
}

/** Slug de la academia del host, o null si es Artiefy (u otro host). */
export function slugAcademiaDesdeHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  for (const raiz of DOMINIOS_RAIZ) {
    if (!hostname.endsWith(`.${raiz}`)) continue;
    const sub = hostname.slice(0, -(raiz.length + 1));
    if (!sub.includes('.') && esSlugAcademiaValido(sub)) return sub;
  }
  return null;
}

/**
 * URL pública de una academia. Desde el panel de Artiefy en local
 * (localhost:3000) apunta a <slug>.localhost:3000; en producción a
 * https://<slug>.artiefy.com.
 */
export function urlAcademia(
  slug: string,
  ruta = '',
  origenActual?: string
): string {
  if (origenActual) {
    const u = new URL(origenActual);
    if (u.hostname === 'localhost' || u.hostname.endsWith('.localhost')) {
      return `${u.protocol}//${slug}.localhost${u.port ? `:${u.port}` : ''}${ruta}`;
    }
  }
  return `https://${slug}.artiefy.com${ruta}`;
}
