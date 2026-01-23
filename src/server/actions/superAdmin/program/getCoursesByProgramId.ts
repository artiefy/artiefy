import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  courseInstructors,
  courses,
  materias,
  users,
} from '~/server/db/schema';

export async function getCoursesByProgramId(programId: string) {
  try {
    const result = await db
      .selectDistinct({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        coverImageKey: courses.coverImageKey,
        categoryid: courses.categoryid,
        instructor: courses.instructor, // Campo legacy por compatibilidad
        modalidadesid: courses.modalidadesid,
        nivelid: courses.nivelid,
        rating: courses.rating,
      })
      .from(courses)
      .innerJoin(materias, eq(materias.programaId, parseInt(programId)))
      .where(eq(courses.id, materias.courseid));

    // Obtener todos los instructores para cada curso desde course_instructors
    const coursesWithInstructors = await Promise.all(
      result.map(async (course) => {
        try {
          // Obtener todos los IDs de instructores de este curso
          const instructorRelations = await db
            .select()
            .from(courseInstructors)
            .where(eq(courseInstructors.courseId, course.id));

          const instructorIds = instructorRelations.map(
            (rel) => rel.instructorId
          );

          if (instructorIds.length === 0) {
            return {
              ...course,
              instructors: [],
              instructorName: 'Sin instructor asignado',
            };
          }

          // Obtener nombres de todos los instructores
          const instructorNames = await Promise.all(
            instructorIds.map(async (instructorId) => {
              try {
                // Primero intentar desde la tabla users
                const dbUser = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, instructorId))
                  .limit(1);

                if (dbUser?.[0]?.name) {
                  return dbUser[0].name;
                }

                // Si no está en DB, intentar con Clerk
                try {
                  const clerk = await clerkClient();
                  const user = await clerk.users.getUser(instructorId);
                  const name =
                    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
                  return name || instructorId;
                } catch (_) {
                  return instructorId;
                }
              } catch (error) {
                console.error(
                  `Error fetching instructor ${instructorId}:`,
                  error
                );
                return instructorId;
              }
            })
          );

          return {
            ...course,
            instructors: instructorIds,
            instructorName: instructorNames.join(', '), // Concatenar nombres para compatibilidad
          };
        } catch (error) {
          console.error(
            `Error fetching instructors for course ${course.id}:`,
            error
          );
          return {
            ...course,
            instructors: course.instructor ? [course.instructor] : [],
            instructorName: course.instructor || 'Sin instructor asignado',
          };
        }
      })
    );

    return coursesWithInstructors;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}
