import { cache } from 'react';
import { db } from '~/server/db';
import { courses, categories, modalidades, dificultad } from '~/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const getAllCourses = cache(async () => {
  try {
    const coursesData = await db
      .select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        coverImageKey: courses.coverImageKey,
        categoryid: courses.categoryid,
        instructor: courses.instructor,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        creatorId: courses.creatorId,
        rating: courses.rating,
        modalidadesid: courses.modalidadesid,
        dificultadid: courses.dificultadid,
        categoryName: categories.name,
        categoryDescription: categories.description,
        modalidadName: modalidades.name,
        dificultadName: dificultad.name,
        isFeatured: categories.is_featured,
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryid, categories.id))
      .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
      .leftJoin(dificultad, eq(courses.dificultadid, dificultad.id))
      .orderBy(desc(courses.createdAt));

    return coursesData.map((course) => ({
      id: course.id,
      title: course.title ?? '',
      description: course.description ?? '',
      coverImageKey: course.coverImageKey ?? '',
      categoryid: course.categoryid,
      instructor: course.instructor ?? '',
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      creatorId: course.creatorId,
      rating: Number(course.rating ?? 0),
      modalidadesid: course.modalidadesid,
      dificultadid: course.dificultadid,
      totalStudents: 0,
      lessons: [],
      category: {
        id: course.categoryid,
        name: course.categoryName ?? '',
        description: course.categoryDescription ?? '',
        is_featured: course.isFeatured ?? false,
      },
      modalidad: { name: course.modalidadName ?? '' },
      dificultad: { name: course.dificultadName ?? '' },
      isFeatured: course.isFeatured ?? false,
    }));
  } catch (error) {
    console.error('Error al obtener todos los cursos:', error);
    throw new Error('Error al obtener todos los cursos: ' + (error instanceof Error ? error.message : String(error)));
  }
});
