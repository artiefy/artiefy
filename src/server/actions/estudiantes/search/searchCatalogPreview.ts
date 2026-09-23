'use server';

import { and, countDistinct, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  guidedObjectives,
  guidedProjects,
  lessons,
  materias,
  programas,
} from '~/server/db/schema';

import type { SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export type CatalogResultKind = 'course' | 'guided' | 'program';

export interface CatalogSearchResult {
  id: number;
  kind: CatalogResultKind;
  title: string;
  meta: string;
  href: string;
  /** Inactive courses are listed as "coming soon" and are not navigable. */
  isComingSoon: boolean;
  score: number;
}

const MAX_RESULTS = 6;
const PER_KIND_LIMIT = 6;
const MAX_QUERY_LENGTH = 100;

const ACCENT_FROM = 'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ';
const ACCENT_TO = 'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC';

const normalize = (column: AnyPgColumn) =>
  sql`translate(lower(${column}), ${ACCENT_FROM}, ${ACCENT_TO})`;

/**
 * Relevance score shared by every catalog type so results can be merged:
 * title prefix > title contains > secondary field match, plus trigram
 * similarity on the title to rank typos and partial words.
 */
function buildRanking(
  title: AnyPgColumn,
  secondary: AnyPgColumn[],
  query: string
) {
  const titleN = normalize(title);
  const contains = `%${query}%`;
  const secondaryMatch =
    secondary.length > 0
      ? or(...secondary.map((col) => sql`${normalize(col)} like ${contains}`))
      : sql`false`;
  const similarity = sql`word_similarity(${query}, ${titleN})`;

  const score = sql<number>`(
    case
      when ${titleN} like ${`${query}%`} then 3
      when ${titleN} like ${contains} then 2
      when ${secondaryMatch} then 1
      else 0
    end
  ) + ${similarity}`.mapWith(Number);

  const matches: SQL | undefined = or(
    sql`${titleN} like ${contains}`,
    secondaryMatch,
    sql`${similarity} >= 0.5`
  );

  return { score, matches };
}

const plural = (count: number, singular: string, pluralForm: string) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

const formatHours = (minutes: number) => {
  if (minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
};

async function searchCourses(query: string): Promise<CatalogSearchResult[]> {
  const { score, matches } = buildRanking(
    courses.title,
    [categories.name],
    query
  );

  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      isActive: courses.isActive,
      categoryName: categories.name,
      lessonCount: countDistinct(lessons.id),
      minutes: sql<number>`coalesce(sum(${lessons.duration}), 0)`.mapWith(
        Number
      ),
      score,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(lessons, eq(lessons.courseId, courses.id))
    .where(
      and(or(isNull(courses.visibility), eq(courses.visibility, true)), matches)
    )
    .groupBy(courses.id, categories.name)
    .orderBy(sql`${score} desc`)
    .limit(PER_KIND_LIMIT);

  return rows.map((row) => {
    const hours = formatHours(row.minutes);
    const meta = [
      row.lessonCount > 0
        ? plural(row.lessonCount, 'clase', 'clases')
        : row.categoryName,
      hours,
    ]
      .filter(Boolean)
      .join(' · ');

    return {
      id: row.id,
      kind: 'course',
      title: row.title,
      meta: meta || 'Curso',
      href: `/estudiantes/cursos/${row.id}`,
      isComingSoon: row.isActive === false,
      score: row.score,
    };
  });
}

async function searchGuidedProjects(
  query: string
): Promise<CatalogSearchResult[]> {
  const { score, matches } = buildRanking(
    guidedProjects.title,
    [guidedProjects.subtitle, guidedProjects.techStack],
    query
  );

  const rows = await db
    .select({
      id: guidedProjects.id,
      title: guidedProjects.title,
      techStack: guidedProjects.techStack,
      objectiveCount: countDistinct(guidedObjectives.id),
      score,
    })
    .from(guidedProjects)
    .leftJoin(
      guidedObjectives,
      eq(guidedObjectives.guidedProjectId, guidedProjects.id)
    )
    .where(
      and(
        or(
          isNull(guidedProjects.visibility),
          eq(guidedProjects.visibility, true)
        ),
        or(isNull(guidedProjects.isActive), eq(guidedProjects.isActive, true)),
        matches
      )
    )
    .groupBy(guidedProjects.id)
    .orderBy(sql`${score} desc`)
    .limit(PER_KIND_LIMIT);

  return rows.map((row) => {
    const stack = row.techStack
      ?.split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(' + ');
    const meta = [
      stack,
      row.objectiveCount > 0
        ? plural(row.objectiveCount, 'objetivo', 'objetivos')
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

    return {
      id: row.id,
      kind: 'guided',
      title: row.title,
      meta: meta || 'Proyecto guiado',
      href: `/estudiantes/proyectos-guiados/${row.id}`,
      isComingSoon: false,
      score: row.score,
    };
  });
}

async function searchPrograms(query: string): Promise<CatalogSearchResult[]> {
  const { score, matches } = buildRanking(
    programas.title,
    [categories.name, programas.description],
    query
  );

  const rows = await db
    .select({
      id: programas.id,
      title: programas.title,
      courseCount: countDistinct(materias.courseid),
      score,
    })
    .from(programas)
    .leftJoin(categories, eq(programas.categoryid, categories.id))
    .leftJoin(materias, eq(materias.programaId, programas.id))
    .where(
      and(
        or(isNull(programas.visibility), eq(programas.visibility, true)),
        matches
      )
    )
    .groupBy(programas.id, categories.name)
    .orderBy(sql`${score} desc`)
    .limit(PER_KIND_LIMIT);

  return rows.map((row) => ({
    id: row.id,
    kind: 'program',
    title: row.title,
    meta:
      row.courseCount > 0
        ? `${plural(row.courseCount, 'curso', 'cursos')} · ruta completa`
        : 'Ruta completa',
    href: `/estudiantes/programas/${row.id}`,
    isComingSoon: false,
    score: row.score,
  }));
}

const KIND_ORDER: Record<CatalogResultKind, number> = {
  course: 0,
  guided: 1,
  program: 2,
};

/**
 * Searches courses, guided projects and programs at once and returns the
 * most likely matches across all three, ranked by a shared relevance score.
 */
export async function searchCatalogPreview(
  rawQuery: string
): Promise<CatalogSearchResult[]> {
  const query = rawQuery
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .slice(0, MAX_QUERY_LENGTH);

  if (query.length < 2) return [];

  const settled = await Promise.allSettled([
    searchCourses(query),
    searchGuidedProjects(query),
    searchPrograms(query),
  ]);

  const results = settled.flatMap((outcome) => {
    if (outcome.status === 'fulfilled') return outcome.value;
    console.error('Catalog search failed:', outcome.reason);
    return [];
  });

  return results
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(a.isComingSoon) - Number(b.isComingSoon) ||
        KIND_ORDER[a.kind] - KIND_ORDER[b.kind]
    )
    .slice(0, MAX_RESULTS);
}
