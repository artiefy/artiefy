#!/usr/bin/env tsx
/**
 * Read-only diagnostic: compares courses in the database against the
 * courses that actually have rows in document_embeddings.
 *
 * Writes nothing. Safe to run at any time.
 *
 *   npx tsx scripts/check-embeddings-coverage.ts
 */

import 'dotenv/config';

import { sql } from 'drizzle-orm';

import { db } from '../src/server/db';
import { courses } from '../src/server/db/schema';
import { documentEmbeddings } from '../src/server/db/schema';

async function main() {
  const allCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .orderBy(courses.id);

  const indexed = await db
    .select({
      courseId: documentEmbeddings.courseId,
      chunks: sql<number>`count(*)::int`,
      lastUpdated: sql<string>`max(${documentEmbeddings.updatedAt})`,
    })
    .from(documentEmbeddings)
    .groupBy(documentEmbeddings.courseId);

  const indexedMap = new Map(indexed.map((row) => [String(row.courseId), row]));

  const missing: typeof allCourses = [];
  const covered: {
    id: number;
    title: string;
    chunks: number;
    lastUpdated: string;
  }[] = [];

  for (const course of allCourses) {
    const row = indexedMap.get(String(course.id));
    if (row) {
      covered.push({
        id: course.id,
        title: course.title,
        chunks: row.chunks,
        lastUpdated: row.lastUpdated,
      });
    } else {
      missing.push(course);
    }
  }

  const orphanIds = [...indexedMap.keys()].filter(
    (id) => !allCourses.some((course) => String(course.id) === id)
  );

  console.log('\n=== EMBEDDINGS COVERAGE ===\n');
  console.log(`Courses in database:      ${allCourses.length}`);
  console.log(`Courses with embeddings:  ${covered.length}`);
  console.log(`Courses WITHOUT embeddings: ${missing.length}`);
  console.log(`Orphan course ids in embeddings table: ${orphanIds.length}`);

  if (missing.length > 0) {
    console.log('\n--- MISSING (never indexed) ---');
    for (const course of missing) {
      console.log(`  ${course.id}\t${course.title}`);
    }
    console.log(
      `\n  Regenerate only these:\n  ${missing
        .map((c) => `npm run embeddings:regen -- --courseId=${c.id}`)
        .join('\n  ')}`
    );
  }

  if (covered.length > 0) {
    console.log('\n--- INDEXED (chunks / last updated) ---');
    const sorted = [...covered].sort(
      (a, b) => Date.parse(a.lastUpdated) - Date.parse(b.lastUpdated)
    );
    for (const course of sorted) {
      console.log(
        `  ${course.id}\t${course.chunks} chunks\t${course.lastUpdated}\t${course.title}`
      );
    }
  }

  if (orphanIds.length > 0) {
    console.log('\n--- ORPHANS (embeddings for deleted courses) ---');
    console.log(`  ${orphanIds.join(', ')}`);
  }

  console.log('');
  process.exit(0);
}

main().catch((error) => {
  console.error('Diagnostic failed:', error);
  process.exit(1);
});
