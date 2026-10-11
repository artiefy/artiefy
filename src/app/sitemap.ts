import { type MetadataRoute } from 'next';
import { cacheLife, cacheTag } from 'next/cache';

import { getIndexableCatalog } from '~/server/queries/sitemap';

// The cache directive lives at the call site, not in the shared data layer
// (see the `no-restricted-syntax` rule and src/app/estudiantes/_cache/).
async function getCachedIndexableCatalog() {
  'use cache';
  cacheLife('hours');
  cacheTag('sitemap');

  return getIndexableCatalog();
}

// Canonical, indexable public routes plus every course and program that passes
// the same index rule as its page. Static routes omit `lastModified` (a value
// that changes on every request is ignored by Google); catalog entries use the
// real `updated_at`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://artiefy.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl },
    { url: `${baseUrl}/estudiantes` },
    { url: `${baseUrl}/planes` },
    { url: `${baseUrl}/sign-in` },
  ];

  try {
    const catalog = await getCachedIndexableCatalog();
    return [
      ...staticRoutes,
      ...catalog.programs.map((program) => ({
        url: `${baseUrl}/estudiantes/programas/${program.id}`,
        lastModified: program.updatedAt,
      })),
      ...catalog.courses.map((course) => ({
        url: `${baseUrl}/estudiantes/cursos/${course.id}`,
        lastModified: course.updatedAt,
      })),
    ];
  } catch (error) {
    // A database outage must not take the sitemap down with it.
    console.error('sitemap: catalog query failed', error);
    return staticRoutes;
  }
}
