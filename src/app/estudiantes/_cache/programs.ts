import { cacheLife, cacheTag } from 'next/cache';

import { getProgramById } from '~/server/actions/estudiantes/programs/getProgramById';

/**
 * Cached read of a program's public record.
 *
 * The cache directive lives here, at the estudiantes call site, rather than
 * inside `~/server/actions/**`. That action is also consumed by
 * `app/api/estudiantes/programas/[id]/cover` and by the certificate pages;
 * caching it at the source would silently cache those callers too.
 *
 * Safe to cache: `getProgramById` reads no `auth()`, `cookies()` or
 * `headers()`, so the result is identical for every visitor and the id is the
 * whole cache key.
 */
export async function getCachedProgramById(id: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('programs', `program-${id}`);

  return getProgramById(id);
}
