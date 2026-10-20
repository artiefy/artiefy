import { sql } from 'drizzle-orm';

import { MIN_INDEXABLE_DESCRIPTION_LENGTH } from '~/lib/metadata/config';
import { db } from '~/server/db';
import { courses, programas } from '~/server/db/schema';
import { withRetry } from '~/server/db/withRetry';

interface CatalogEntry {
  id: number;
  updatedAt: Date;
}

/**
 * Courses and programs that the sitemap lists. Mirrors the per-page rule in
 * `generateMetadata` (active/visible and a real description), so the sitemap
 * never lists a URL that answers `noindex`.
 */
export async function getIndexableCatalog(): Promise<{
  courses: CatalogEntry[];
  programs: CatalogEntry[];
}> {
  const [courseRows, programRows] = await Promise.all([
    withRetry(() =>
      db
        .select({ id: courses.id, updatedAt: courses.updatedAt })
        .from(courses)
        .where(
          sql`coalesce(${courses.isActive}, true) and length(trim(coalesce(${courses.description}, ''))) >= ${MIN_INDEXABLE_DESCRIPTION_LENGTH}`
        )
    ),
    withRetry(() =>
      db
        .select({ id: programas.id, updatedAt: programas.updatedAt })
        .from(programas)
        .where(
          sql`coalesce(${programas.visibility}, true) and length(trim(coalesce(${programas.description}, ''))) >= ${MIN_INDEXABLE_DESCRIPTION_LENGTH}`
        )
    ),
  ]);

  return { courses: courseRows, programs: programRows };
}
