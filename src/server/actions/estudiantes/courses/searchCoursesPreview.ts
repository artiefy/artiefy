'use server';

import { eq, ilike, or } from 'drizzle-orm';

import { db } from '~/server/db';
import { categories, courses, modalidades } from '~/server/db/schema';

import type { Course } from '~/types';

// Busca cursos por texto en título, categoría o modalidad
export async function searchCoursesPreview(query: string): Promise<Course[]> {
  if (!query || query.trim().length < 2) return [];
  const normalizedQuery = query.trim().toLowerCase();

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
    })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryid, categories.id))
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .where(
      or(
        ilike(courses.title, `%${normalizedQuery}%`),
        ilike(categories.name, `%${normalizedQuery}%`),
        ilike(modalidades.name, `%${normalizedQuery}%`)
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
