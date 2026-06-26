'use server';

import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  modalidades,
  typesCourses,
} from '~/server/db/schema';

import type { Course } from '~/types';

// Busca cursos por texto en título, categoría o modalidad
export async function searchCoursesPreview(query: string): Promise<Course[]> {
  if (!query || query.trim().length < 2) return [];
  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const accentFrom = 'áàäâãåÁÀÄÂÃÅéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ';
  const accentTo = 'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC';
  const searchPattern = `%${normalizedQuery}%`;
  const normalizeColumn = (column: unknown) =>
    sql`translate(lower(${column}), ${accentFrom}, ${accentTo})`;

  // Coincidencia de texto en título, categoría, modalidad o tipo de curso.
  const textCondition = or(
    sql`${normalizeColumn(courses.title)} ilike ${searchPattern}`,
    sql`${normalizeColumn(categories.name)} ilike ${searchPattern}`,
    sql`${normalizeColumn(modalidades.name)} ilike ${searchPattern}`,
    sql`${normalizeColumn(typesCourses.type)} ilike ${searchPattern}`
  );
  const titleSimilarity = sql<number>`word_similarity(
    ${normalizedQuery}, ${normalizeColumn(courses.title)}
  )`;
  const fuzzyTitleCondition = sql`${titleSimilarity} >= 0.5`;

  // Los cursos con visibility desactivada nunca aparecen en el buscador,
  // sin importar si el usuario está logueado o no.
  const whereCondition = and(
    or(isNull(courses.visibility), eq(courses.visibility, true)),
    or(textCondition, fuzzyTitleCondition)
  );

  const results = await db
    .select({
      id: courses.id,
      title: courses.title,
      coverImageKey: courses.coverImageKey,
      categoryid: courses.categoryid,
      modalidadesid: courses.modalidadesid,
      instructor: courses.instructor,
      description: courses.description,
      isActive: courses.isActive,
      categoryName: categories.name,
      modalidadName: modalidades.name,
      idTypesCourses: courses.idTypesCourses,
      typeCourseId: typesCourses.id,
      typeCourseType: typesCourses.type,
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .leftJoin(typesCourses, eq(courses.idTypesCourses, typesCourses.id))
    .where(whereCondition)
    .orderBy(
      sql`case when ${textCondition} then 0 else 1 end`,
      sql`${titleSimilarity} desc`,
      asc(courses.title)
    )
    .limit(8);

  // Formatear resultados para cumplir con la interfaz Course
  return results.map((course) => ({
    id: course.id,
    title: course.title ?? '',
    description: course.description ?? '',
    coverImageKey: course.coverImageKey ?? '',
    categoryid: course.categoryid,
    instructor: course.instructor ?? '',
    instructorName: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    creatorId: '',
    rating: 0,
    modalidadesid: course.modalidadesid,
    nivelid: 0,
    totalStudents: 0,
    lessons: [],
    category: {
      id: course.categoryid,
      name: course.categoryName ?? '',
      description: '',
      is_featured: false,
    },
    modalidad: { id: course.modalidadesid, name: course.modalidadName ?? '' },
    idTypesCourses: course.idTypesCourses,
    typeCourse: course.typeCourseId
      ? {
          id: course.typeCourseId,
          type: course.typeCourseType ?? '',
        }
      : null,
    nivel: { name: '' },
    enrollments: [],
    creator: undefined,
    isNew: false,
    requerimientos: [],
    materias: [],
    isFree: false,
    requiresSubscription: false,
    courseTypeId: null,
    courseType: undefined,
    courseTypes: [],
    individualPrice: null,
    requiresProgram: false,
    isActive: Boolean(course.isActive),
    metaPixelId: '',
    is_featured: false,
    is_top: false,
  }));
}
