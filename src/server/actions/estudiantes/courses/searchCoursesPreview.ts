'use server';

import { auth } from '@clerk/nextjs/server';
import { and, eq, isNull, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  enrollments,
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
  const { userId } = await auth();
  const publicVisibilityCondition = or(
    isNull(courses.visibility),
    eq(courses.visibility, true)
  );
  const visibilityCondition = userId
    ? or(
        publicVisibilityCondition,
        sql`exists (
          select 1
          from ${enrollments}
          where ${enrollments.userId} = ${userId}
            and ${enrollments.courseId} = ${courses.id}
        )`
      )
    : publicVisibilityCondition;

  // Buscar en título, categoría y modalidad
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
    .where(
      and(
        visibilityCondition,
        or(
          sql`${normalizeColumn(courses.title)} ilike ${searchPattern}`,
          sql`${normalizeColumn(categories.name)} ilike ${searchPattern}`,
          sql`${normalizeColumn(modalidades.name)} ilike ${searchPattern}`,
          sql`${normalizeColumn(typesCourses.type)} ilike ${searchPattern}`
        )
      )
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
