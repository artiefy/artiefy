'use server';

import { desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  classMeetings,
  courseCourseTypes,
  courses,
  courseTypes,
  modalidades,
  nivel,
  users,
} from '~/server/db/schema';

import type {
  ClassMeeting,
  Course,
  CourseType,
  SubscriptionLevel,
} from '~/types';

// Consulta base separada
const baseCoursesQuery = {
  id: courses.id,
  title: courses.title,
  description: courses.description,
  coverImageKey: courses.coverImageKey,
  categoryid: courses.categoryid,
  instructor: courses.instructor,
  instructorName: users.name,
  createdAt: courses.createdAt,
  updatedAt: courses.updatedAt,
  creatorId: courses.creatorId,
  rating: courses.rating,
  modalidadesid: courses.modalidadesid,
  nivelid: courses.nivelid,
  categoryName: categories.name,
  categoryDescription: categories.description,
  modalidadName: modalidades.name,
  nivelName: nivel.name,
  isFeatured: categories.is_featured,
  courseTypeId: courses.courseTypeId,
  courseTypeName: courseTypes.name,
  requiredSubscriptionLevel: courseTypes.requiredSubscriptionLevel,
  isPurchasableIndividually: courseTypes.isPurchasableIndividually,
  price: courseTypes.price,
  requiresProgram: courses.requiresProgram,
  isActive: courses.isActive,
  individualPrice: courses.individualPrice,
  is_featured: courses.is_featured, // Add this field
  is_top: courses.is_top, // Add this field
  scheduleOptionId: courses.scheduleOptionId,
  spaceOptionId: courses.spaceOptionId,
  horario: courses.horario,
  espacios: courses.espacios,
};

export async function getAllCourses(): Promise<Course[]> {
  try {
    // Fetch basic course data
    const coursesData = await db
      .select(baseCoursesQuery)
      .from(courses)
      .leftJoin(categories, eq(courses.categoryid, categories.id))
      .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
      .leftJoin(nivel, eq(courses.nivelid, nivel.id))
      .leftJoin(courseTypes, eq(courses.courseTypeId, courseTypes.id))
      .leftJoin(users, eq(courses.instructor, users.id))
      .where(eq(courses.requiresProgram, false))
      .orderBy(desc(courses.createdAt))
      .limit(100);

    // Fetch all course types for all courses in one query
    const allCourseIds = coursesData.map((course) => course.id);

    // Only fetch course types if we have courses
    let courseTypesMap: Record<number, CourseType[]> = {};

    if (allCourseIds.length > 0) {
      const allCourseTypeRelations = await db.query.courseCourseTypes.findMany({
        where: inArray(courseCourseTypes.courseId, allCourseIds),
        with: {
          courseType: true,
        },
      });

      // Group course types by course ID for easier access
      courseTypesMap = {};
      allCourseTypeRelations.forEach((relation) => {
        const courseId = relation.courseId;
        if (!courseTypesMap[courseId]) {
          courseTypesMap[courseId] = [];
        }
        courseTypesMap[courseId].push({
          id: relation.courseType.id,
          name: relation.courseType.name,
          description: relation.courseType.description,
          requiredSubscriptionLevel: relation.courseType
            .requiredSubscriptionLevel as SubscriptionLevel,
          isPurchasableIndividually:
            relation.courseType.isPurchasableIndividually,
          price: relation.courseType.price,
        });
      });
    }

    // --- NUEVO: Obtener classMeetings para todos los cursos ---
    let classMeetingsMap: Record<number, ClassMeeting[]> = {};
    if (allCourseIds.length > 0) {
      const allMeetings = await db
        .select()
        .from(classMeetings)
        .where(inArray(classMeetings.courseId, allCourseIds));

      // Agrupar por courseId
      classMeetingsMap = {};
      for (const meeting of allMeetings) {
        const courseId = meeting.courseId;
        if (!classMeetingsMap[courseId]) {
          classMeetingsMap[courseId] = [];
        }
        classMeetingsMap[courseId].push({
          id: meeting.id,
          courseId: meeting.courseId,
          title: meeting.title,
          startDateTime: meeting.startDateTime
            ? new Date(meeting.startDateTime).toISOString()
            : '',
          endDateTime: meeting.endDateTime
            ? new Date(meeting.endDateTime).toISOString()
            : '',
          joinUrl: meeting.joinUrl ?? null,
          weekNumber: meeting.weekNumber ?? null,
          createdAt: meeting.createdAt
            ? new Date(meeting.createdAt).toISOString()
            : null,
          meetingId: meeting.meetingId,
          video_key: meeting.video_key ?? null,
          progress: meeting.progress ?? null,
        });
      }
    }

    // Transform course data synchronously now that we have all needed data
    const transformedCourses: Course[] = coursesData.map((course) => ({
      id: course.id,
      title: course.title ?? '',
      description: course.description ?? '',
      coverImageKey: course.coverImageKey ?? '',
      categoryid: course.categoryid,
      instructor: course.instructor ?? '',
      instructorName: course.instructorName ?? 'no encontrado',
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      creatorId: course.creatorId,
      rating: Number(course.rating ?? 0),
      modalidadesid: course.modalidadesid,
      nivelid: course.nivelid,
      totalStudents: 0,
      lessons: [],
      category: {
        id: course.categoryid,
        name: course.categoryName ?? '',
        description: course.categoryDescription ?? '',
        is_featured: course.isFeatured ?? false,
      },
      modalidad: { name: course.modalidadName ?? '' },
      nivel: { name: course.nivelName ?? '' },
      isFeatured: course.isFeatured ?? false,
      requerimientos: [] as string[],
      courseTypeId: course.courseTypeId ?? null,
      courseType: course.courseTypeId
        ? {
            name: course.courseTypeName ?? '',
            requiredSubscriptionLevel:
              course.requiredSubscriptionLevel! || 'none',
            isPurchasableIndividually: Boolean(
              course.isPurchasableIndividually
            ),
            price: course.courseTypeId === 4 ? course.individualPrice : null,
          }
        : undefined,
      courseTypes: courseTypesMap[course.id] ?? [],
      individualPrice: course.individualPrice ?? null,
      isActive: Boolean(course.isActive),
      requiresProgram: Boolean(course.requiresProgram),
      is_featured: course.is_featured ?? false,
      is_top: course.is_top ?? false,
      scheduleOptionId: course.scheduleOptionId,
      spaceOptionId: course.spaceOptionId,
      horario: course.horario ?? '',
      espacios:
        course.espacios !== undefined && course.espacios !== null
          ? String(course.espacios)
          : '',
      // Añadir classMeetings para que esté disponible en el front
      classMeetings: classMeetingsMap[course.id] ?? [],
    }));

    return transformedCourses;
  } catch (err) {
    console.error(
      'Error al obtener todos los cursos:',
      err instanceof Error ? err.message : err
    );
    throw new Error(
      `Error al obtener todos los cursos: ${err instanceof Error ? err.message : 'Error desconocido'}`
    );
  }
}

// Precargar datos - opcional, puedes removerlo si no lo necesitas
export async function preloadAllCourses(): Promise<void> {
  await getAllCourses();
}

// Utilidad opcional para listar cursos activos (sirve como fallback/local testing).
export interface BasicCourse {
  id: number;
  title: string;
  description: string | null;
  modalidad?: string;
  modalidadId?: number | null;
}

export async function getAllActiveCourses(limit = 5): Promise<BasicCourse[]> {
  const rows = await db
    .select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      modalidadId: courses.modalidadesid,
      modalidadName: modalidades.name,
    })
    .from(courses)
    .leftJoin(modalidades, eq(courses.modalidadesid, modalidades.id))
    .where(or(eq(courses.isActive, true), isNull(courses.isActive)))
    .orderBy(sql`${courses.updatedAt} DESC`)
    .limit(Math.min(Math.max(limit, 1), 50));

  return rows.map((c) => ({
    id: c.id,
    title: c.title ?? '',
    description: c.description ?? '',
    modalidad: c.modalidadName ?? undefined,
    modalidadId: c.modalidadId ?? undefined,
  }));
}

export default getAllCourses;
