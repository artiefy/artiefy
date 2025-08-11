import { eq, sql } from 'drizzle-orm';

import { db } from '~/server/db';
import {
  categories,
  courses,
  enrollmentPrograms,
  materias,
  programas,
} from '~/server/db/schema';

import type { Program } from '~/types';

export const getProgramById = async (id: string): Promise<Program | null> => {
  try {
    // Get program basic data
    const program = await db.query.programas.findFirst({
      where: eq(programas.id, parseInt(id, 10)),
    });

    if (!program) {
      return null;
    }

    // Get materias with their courses and categories in a single query
    const materiasWithCourses = await db
      .select()
      .from(materias)
      .leftJoin(courses, eq(materias.courseid, courses.id))
      .leftJoin(categories, eq(courses.categoryid, categories.id))
      .where(eq(materias.programaId, program.id));

    // Get enrollment count
    const enrollmentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollmentPrograms)
      .where(eq(enrollmentPrograms.programaId, parseInt(id, 10)))
      .then((result) => Number(result[0]?.count ?? 0));

    // Transform the results including category information
    const transformedMaterias = materiasWithCourses.map(
      ({ materias, courses, categories }) => ({
        id: materias.id,
        title: materias.title,
        description: materias.description,
        programaId: materias.programaId ?? 0, // Default to 0 if null
        courseid: materias.courseid,
        curso: courses
          ? {
              ...courses,
              totalStudents: enrollmentCount,
              lessons: [],
              requerimientos: [],
              category: categories
                ? {
                    id: categories.id,
                    name: categories.name,
                    description: categories.description,
                    is_featured: categories.is_featured,
                  }
                : undefined,
            }
          : undefined, // Keep the structure, but allow 'undefined' if no course is associated
      })
    );

    // Build final program object
    return {
      id: program.id.toString(),
      title: program.title,
      description: program.description,
      coverImageKey: program.coverImageKey,
      createdAt: program.createdAt ? new Date(program.createdAt) : null,
      updatedAt: program.updatedAt ? new Date(program.updatedAt) : null,
      creatorId: program.creatorId,
      rating: program.rating,
      categoryid: program.categoryid,
      materias: transformedMaterias,
    };
  } catch (error) {
    console.error('Error fetching program:', error);
    return null;
  }
};
