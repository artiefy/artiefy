"use server"

import { eq, and, sql, desc } from "drizzle-orm"
import { db } from "~/server/db"
import {
  courses,
  lessons,
  enrollments,
  preferences,
  scores,
  modalidades,
  dificultad,
  coursesTaken,
  projects,
  projectsTaken,
  categories,
  users,
  userLessonsProgress,
  userActivitiesProgress,
} from "~/server/db/schema"
import { cache } from "react"
import type {
  Course,
  Lesson,
  Category,
  Preference,
  Score,
  CourseTaken,
  Project,
  ProjectTaken,
  Activity,
  Enrollment,
} from "~/types"
import { currentUser } from "@clerk/nextjs/server"

export const getAllCourses = cache(async (): Promise<Course[]> => {
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
      .execute()

    return coursesData.map((course) => ({
      id: course.id,
      title: course.title ?? "",
      description: course.description ?? "",
      coverImageKey: course.coverImageKey ?? "",
      categoryid: course.categoryid,
      instructor: course.instructor ?? "",
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      creatorId: course.creatorId,
      rating: Number(course.rating ?? 0),
      modalidadesid: course.modalidadesid,
      dificultadid: course.dificultadid,
      totalStudents: 0, // Este dato no se obtiene en esta consulta
      lessons: [],
      category: {
        id: course.categoryid,
        name: course.categoryName ?? "",
        description: course.categoryDescription ?? "",
        is_featured: course.isFeatured ?? false,
      },
      modalidad: { name: course.modalidadName ?? "" },
      dificultad: { name: course.dificultadName ?? "" },
      isFeatured: course.isFeatured ?? false,
    }))
  } catch (error) {
    console.error("Error fetching all courses:", error)
    throw new Error("Failed to fetch all courses: " + (error instanceof Error ? error.message : String(error)))
  }
})

export const getAllCategories = cache(async (): Promise<Category[]> => {
  try {
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        is_featured: categories.is_featured,
        courseCount: sql<number>`COUNT(${courses.id})`,
      })
      .from(categories)
      .leftJoin(courses, eq(categories.id, courses.categoryid))
      .groupBy(categories.id)

    return allCategories.map((category) => ({
      ...category,
      courses: { length: Number(category.courseCount) },
    }))
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw new Error("Failed to fetch categories: " + (error instanceof Error ? error.message : String(error)))
  }
})

export const getFeaturedCategories = cache(async (limit = 6): Promise<Category[]> => {
  try {
    const featuredCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        is_featured: categories.is_featured,
        courseCount: sql<number>`COUNT(${courses.id})`,
      })
      .from(categories)
      .leftJoin(courses, eq(categories.id, courses.categoryid))
      .where(eq(categories.is_featured, true))
      .groupBy(categories.id)
      .limit(limit)

    return featuredCategories.map((category) => ({
      ...category,
      courses: { length: Number(category.courseCount) },
    }))
  } catch (error) {
    console.error("Error fetching featured categories:", error)
    throw new Error("Failed to fetch featured categories: " + (error instanceof Error ? error.message : String(error)))
  }
})

// Obtener un curso específico por ID
export async function getCourseById(courseId: number): Promise<Course | null> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      category: true,
      modalidad: true,
      dificultad: true,
      lessons: {
        orderBy: (lessons, { desc }) => [desc(lessons.order)],
        with: {
          activities: true,
        },
      },
      enrollments: true,
    },
  });

  if (!course) {
    return null;
  }

  // Transformamos los datos para asegurar que cumplen con los tipos
  const transformedCourse: Course = {
    ...course,
    totalStudents: course.enrollments?.length ?? 0,
    lessons: course.lessons?.map((lesson) => ({
      ...lesson,
      isLocked: lesson.isLocked ?? true,
      isCompleted: false,
      userProgress: 0,
      porcentajecompletado: 0,
      activities: lesson.activities?.map((activity) => ({
        ...activity,
        isCompleted: false,
        userProgress: 0,
      })) ?? [],
    })) ?? [],
  };

  return transformedCourse;
}

// Inscribirse en un curso
export async function enrollInCourse(courseId: number): Promise<{ success: boolean; message: string }> {
  const user = await currentUser();

  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  try {
    // Verificar si el usuario existe en la tabla de usuarios
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    // Si el usuario no existe, insertarlo en la tabla de usuarios
    if (!existingUser) {
      if (user.fullName && user.emailAddresses[0]?.emailAddress) {
        await db.insert(users).values({
          id: userId,
          role: 'student',
          name: user.fullName,
          email: user.emailAddresses[0].emailAddress,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        throw new Error('Información del usuario incompleta');
      }
    }

    // Verificar si ya existe una inscripción
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    }) as Enrollment | undefined;

    if (existingEnrollment) {
      return { success: false, message: 'Ya estás inscrito en este curso' };
    }

    // Realizar la inscripción
    const [newEnrollment] = await db
      .insert(enrollments)
      .values({
        userId,
        courseId,
        enrolledAt: new Date(),
        completed: false,
      })
      .returning();

    if (!newEnrollment) {
      return { success: false, message: 'Error al crear la inscripción' };
    }

    // Desbloquear solo la primera lección del curso
    const firstLesson = await db.query.lessons.findFirst({
      where: and(
        eq(lessons.courseId, courseId),
        eq(lessons.order, 1)
      ),
    });

    if (firstLesson) {
      await db.update(lessons)
        .set({ isLocked: false })
        .where(eq(lessons.id, firstLesson.id));
    }

    // Bloquear todas las demás lecciones del curso
    await db.update(lessons)
      .set({ isLocked: true })
      .where(and(
        eq(lessons.courseId, courseId),
        sql`${lessons.id} != ${firstLesson?.id}`
      ));

    return { success: true, message: 'Inscripción exitosa' };
  } catch (error: unknown) {
    console.error('Error al inscribirse en el curso:', error);
    if (error instanceof Error) {
      return { success: false, message: `Error al inscribirse en el curso: ${error.message}` };
    } else {
      return { success: false, message: 'Error desconocido al inscribirse en el curso' };
    }
  }
}

// Función para desuscribirse de un curso
export async function unenrollFromCourse(courseId: number): Promise<void> {
  const user = await currentUser();
  
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  try {
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (!existingEnrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    await db.delete(enrollments)
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ));

  } catch (error) {
    console.error('Error al desuscribirse del curso:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Error desconocido al desuscribirse del curso');
    }
  }
}

// Obtener todas las lecciones de un curso
export async function getLessonsByCourseId(courseId: number): Promise<Lesson[]> {
  const lessonsData = await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    orderBy: [desc(lessons.order)],
    with: {
      activities: true,
    },
  });
  return lessonsData.map((lesson) => ({
    ...lesson,
    porcentajecompletado: 0, // Se obtiene de userLessonsProgress
    isLocked: lesson.isLocked ?? true,
    userProgress: 0, // Se obtiene de userLessonsProgress
    isCompleted: false, // Se obtiene de userLessonsProgress
    activities: lesson.activities?.map((activity) => ({
      ...activity,
      isCompleted: false, // Se obtiene de userActivitiesProgress
      userProgress: 0, // Se obtiene de userActivitiesProgress
    })),
  }));
}

// Obtener una lección específica por ID
export async function getLessonById(lessonId: number): Promise<Lesson | null> {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      activities: true,
    },
  });
  if (!lesson) return null;
  return {
    ...lesson,
    porcentajecompletado: 0, // Se obtiene de userLessonsProgress
    isLocked: lesson.isLocked ?? true,
    userProgress: 0, // Se obtiene de userLessonsProgress
    isCompleted: false, // Se obtiene de userLessonsProgress
    activities:
      (lesson.activities as Activity[] | undefined)?.map((activity) => ({
        ...activity,
        isCompleted: false, // Se obtiene de userActivitiesProgress
        userProgress: 0, // Se obtiene de userActivitiesProgress
      })) ?? [],
  };
}

// Actualizar el progreso de una lección
export async function updateLessonProgress(lessonId: number, progress: number): Promise<void> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  await db
    .insert(userLessonsProgress)
    .values({
      userId,
      lessonId,
      progress,
      isCompleted: progress >= 100,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [userLessonsProgress.userId, userLessonsProgress.lessonId],
      set: {
        progress,
        isCompleted: progress >= 100,
        lastUpdated: new Date(),
      },
    });

  if (progress >= 100) {
    await unlockNextLesson(lessonId);
  }
}

// Completar una actividad
export async function completeActivity(activityId: number): Promise<void> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const userId = user.id;

  await db
    .insert(userActivitiesProgress)
    .values({
      userId,
      activityId,
      progress: 100,
      isCompleted: true,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [userActivitiesProgress.userId, userActivitiesProgress.activityId],
      set: {
        progress: 100,
        isCompleted: true,
        lastUpdated: new Date(),
      },
    });
}

// Guardar preferencias del usuario
export async function savePreferences(userId: string, categoryIds: number[]): Promise<void> {
  await db.delete(preferences).where(eq(preferences.userId, userId));
  await db.insert(preferences).values(
    categoryIds.map((categoryId) => ({
      userId,
      categoryid: categoryId,
      name: '',
    }))
  );
}

// Obtener preferencias del usuario
export async function getUserPreferences(userId: string): Promise<Preference[]> {
  return db.query.preferences.findMany({
    where: eq(preferences.userId, userId),
    with: {
      category: true,
    },
  });
}

// Guardar puntaje del usuario
export async function saveScore(userId: string, categoryId: number, score: number): Promise<void> {
  await db.insert(scores).values({
    userId,
    categoryid: categoryId,
    score,
  });
}

// Obtener puntajes del usuario
export async function getUserScores(userId: string): Promise<Score[]> {
  return db.query.scores.findMany({
    where: eq(scores.userId, userId),
    with: {
      category: true,
    },
  });
}

// Marcar un curso como tomado
export async function markCourseTaken(userId: string, courseId: number): Promise<void> {
  await db.insert(coursesTaken).values({
    userId,
    courseId,
  });
}

// Obtener cursos tomados por el usuario
export async function getUserCoursesTaken(userId: string): Promise<CourseTaken[]> {
  const coursesTakenData = await db.query.coursesTaken.findMany({
    where: eq(coursesTaken.userId, userId),
    with: {
      course: {
        with: {
          enrollments: true,
          lessons: true,
        },
      },
    },
  });

  return coursesTakenData.map((courseTaken) => ({
    ...courseTaken,
    course: {
      ...courseTaken.course,
      totalStudents: courseTaken.course.enrollments?.length ?? 0,
      lessons: courseTaken.course.lessons?.map((lesson) => ({
        ...lesson,
        isLocked: lesson.isLocked ?? true,
        isCompleted: false, // Se obtiene de userLessonsProgress
        userProgress: 0, // Se obtiene de userLessonsProgress
        porcentajecompletado: 0, // Se obtiene de userLessonsProgress
      })) ?? [],
    },
  }));
}

// Obtener todos los proyectos disponibles
export async function getAllProjects(): Promise<Project[]> {
  return db.query.projects.findMany({
    with: {
      category: true,
    },
  });
}

// Obtener un proyecto específico por ID
export async function getProjectById(projectId: number): Promise<Project | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      category: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    ...project,
    name: project.name ?? 'Untitled Project',
  };
}

// Marcar un proyecto como tomado
export async function markProjectTaken(userId: string, projectId: number): Promise<void> {
  await db.insert(projectsTaken).values({
    userId,
    projectId,
  });
}

// Obtener proyectos tomados por el usuario
export async function getUserProjectsTaken(userId: string): Promise<ProjectTaken[]> {
  return db.query.projectsTaken.findMany({
    where: eq(projectsTaken.userId, userId),
    with: {
      project: true,
    },
  });
}

// Crear un proyecto
export async function createProject(userId: string, projectData: {
  name: string;
  description: string;
  courseId: number;
  categoryId: number;
  content: string;
}): Promise<void> {
  await db.insert(projects).values({
    name: projectData.name,
    description: projectData.description,
    coverImageKey: null,
    coverVideoKey: null,
    type_project: "default",
    userId: userId,
    categoryid: projectData.categoryId,
  });
}

// Obtener el progreso general del estudiante
export async function getStudentProgress(userId: string): Promise<{
  coursesCompleted: number;
  totalEnrollments: number;
  averageProgress: number;
}> {
  const result = await db
    .select({
      coursesCompleted: sql<number>`COUNT(CASE WHEN ${enrollments.completed} = true THEN 1 END)`,
      totalEnrollments: sql<number>`COUNT(*)`,
      averageProgress: sql<number>`AVG(${userLessonsProgress.progress})`,
    })
    .from(enrollments)
    .leftJoin(userLessonsProgress, eq(enrollments.userId, userLessonsProgress.userId))
    .where(eq(enrollments.userId, userId))
    .groupBy(enrollments.userId);

  return result?.[0] ?? {
    coursesCompleted: 0,
    totalEnrollments: 0,
    averageProgress: 0,
  };
}

// Función para desbloquear una lección 1
export async function unlockLesson(lessonId: number): Promise<void> {
  try {
    await db.update(lessons)
      .set({ isLocked: false })
      .where(eq(lessons.id, lessonId));
  } catch (error) {
    console.error('Error al desbloquear la lección:', error);
    throw new Error('No se pudo desbloquear la lección');
  }
}

// Función para desbloquear una lección 2
export async function unlockNextLesson(currentLessonId: number): Promise<{ success: boolean; nextLessonId?: number }> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  const currentLesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, currentLessonId),
  });

  if (!currentLesson) {
    throw new Error('Lección actual no encontrada');
  }

  const nextLesson = await db.query.lessons.findFirst({
    where: and(
      eq(lessons.courseId, currentLesson.courseId),
      eq(lessons.order, currentLesson.order + 1)
    ),
  });

  if (nextLesson) {
    await db
      .update(lessons)
      .set({ isLocked: false })
      .where(eq(lessons.id, nextLesson.id));
    return { success: true, nextLessonId: nextLesson.id };
  }

  return { success: false };
}


