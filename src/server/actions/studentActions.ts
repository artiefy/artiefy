'use server';

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import {
  courses,
  lessons,
  activities,
  enrollments,
  preferences,
  scores,
  coursesTaken,
  projects,
  projectsTaken,
  categories,
  users,
} from '~/server/db/schema';
import {
  type Course,
  type Lesson,
  type Category,
  type Preference,
  type Score,
  type CourseTaken,
  type Project,
  type ProjectTaken,
  type Activity,
  type Enrollment,
} from '~/types';
import { currentUser } from '@clerk/nextjs/server';


// Obtener todos los cursos disponibles
export async function getAllCourses(): Promise<Course[]> {
  const coursesData = await db.query.courses.findMany({
    with: {
      category: true,
      modalidad: true,
      dificultad: true,
      enrollments: true,
      lessons: {
        with: {
          activities: true,
        },
      },
    },
  });
  return coursesData.map((course) => ({
    ...course,
    totalStudents: course.enrollments?.length ?? 0,
    enrollments:
      course.enrollments?.map((enrollment) => ({
        ...enrollment,
        completed: enrollment.completed ?? false,
      })) ?? [],
    lessons:
      course.lessons?.map((lesson) => ({
        ...lesson,
        porcentajecompletado: lesson.porcentajecompletado ?? 0,
        isLocked: lesson.isLocked ?? true,
        userProgress: lesson.userProgress ?? 0,
        isCompleted: lesson.isCompleted ?? false,
        activities:
          lesson.activities?.map((activity) => ({
            ...activity,
            isCompleted: activity.isCompleted ?? false,
            userProgress: activity.userProgress ?? 0,
          })) ?? [],
      })) ?? [],
  }))
}

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
      isLocked: lesson.isLocked ?? true, // Ensure isLocked is always a boolean
      isCompleted: lesson.isCompleted ?? false, // Ensure isCompleted is always a boolean
      userProgress: lesson.userProgress ?? 0, // Ensure userProgress is always a number
      porcentajecompletado: lesson.porcentajecompletado ?? 0, // Ensure porcentajecompletado is always a number
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
      await db.insert(users).values({
        id: userId,
        role: 'student',
        name: user.fullName,
        email: user.emailAddresses[0]?.emailAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.isLocked ?? true,
    userProgress: lesson.userProgress ?? 0,
    isCompleted: lesson.isCompleted ?? false,
    activities: lesson.activities?.map((activity) => ({
      ...activity,
      isCompleted: activity.isCompleted ?? false,
      userProgress: activity.userProgress ?? 0,
    })),
  }))
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
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.isLocked ?? true,
    userProgress: lesson.userProgress ?? 0,
    isCompleted: lesson.isCompleted ?? false,
    activities:
      (lesson.activities as Activity[] | undefined)?.map((activity) => ({
        ...activity,
        isCompleted: activity.isCompleted ?? false,
        userProgress: activity.userProgress ?? 0,
      })) ?? [],
  };
}

// Actualizar el progreso de una lección
export async function updateLessonProgress(lessonId: number, progress: number): Promise<void> {
  const user = await currentUser();
  if (!user?.id) {
    throw new Error('Usuario no autenticado');
  }

  await db
    .update(lessons)
    .set({
      userProgress: progress,
      isCompleted: progress >= 100,
      lastUpdated: new Date(),
    })
    .where(eq(lessons.id, lessonId));

  if (progress >= 100) {
    await unlockNextLesson(lessonId);
  }
}

// Completar una actividad
export async function completeActivity(activityId: number): Promise<void> {
  await db
    .update(activities)
    .set({
      isCompleted: true,
      userProgress: 100,
      lastUpdated: new Date(),
    })
    .where(eq(activities.id, activityId));
}

// Obtener todas las categorías
export async function getAllCategories(): Promise<Category[]> {
  return db.query.categories.findMany({
    orderBy: [desc(categories.name)],
  });
}

// Nueva acción para obtener las categorías destacadas
export async function getFeaturedCategories(limit = 6): Promise<Category[]> {
  const categoriesData = await db.query.categories.findMany({
    where: eq(categories.is_featured, true),
    orderBy: [desc(categories.name)],
    limit: limit,
    with: {
      courses: {
        with: {
          enrollments: true,
          lessons: true, // Ensure lessons is included
        },
      },
    },
  });

  return categoriesData.map((category) => ({
    ...category,
    courses: category.courses.map((course) => ({
      ...course,
      totalStudents: course.enrollments?.length ?? 0,
      lessons: course.lessons?.map((lesson) => ({
        ...lesson,
        isLocked: lesson.isLocked ?? true,
        isCompleted: lesson.isCompleted ?? false,
        userProgress: lesson.userProgress ?? 0,
        porcentajecompletado: lesson.porcentajecompletado ?? 0,
      })) ?? [],
    })),
  }));
}

// Guardar preferencias del usuario
export async function savePreferences(userId: string, categoryIds: number[]): Promise<void> {
  await db.delete(preferences).where(eq(preferences.userId, userId));
  await db.insert(preferences).values(
    categoryIds.map((categoryId) => ({
      userId,
      categoryid: categoryId,
      name: '', // Asegúrate de proporcionar un valor para el campo 'name'
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
          lessons: true, // Ensure lessons is included
        },
      },
    },
  });

  return coursesTakenData.map((courseTaken) => ({
    ...courseTaken,
    course: {
      ...courseTaken.course,
      totalStudents: courseTaken.course.enrollments?.length ?? 0, // Ensure totalStudents is always set
      lessons: courseTaken.course.lessons?.map((lesson) => ({
        ...lesson,
        isLocked: lesson.isLocked ?? true, // Ensure isLocked is always a boolean
        isCompleted: lesson.isCompleted ?? false, // Ensure isCompleted is always a boolean
        userProgress: lesson.userProgress ?? 0, // Ensure userProgress is always a number
        porcentajecompletado: lesson.porcentajecompletado ?? 0, // Ensure porcentajecompletado is always a number
      })) ?? [], // Ensure lessons is always set
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
  return project ?? null;
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
      averageProgress: sql<number>`AVG(${lessons.userProgress})`,
    })
    .from(enrollments)
    .leftJoin(lessons, eq(enrollments.courseId, lessons.courseId))
    .where(eq(enrollments.userId, userId))
    .groupBy(enrollments.userId);

  return result?.[0] ?? {
    coursesCompleted: 0,
    totalEnrollments: 0,
    averageProgress: 0,
  };
}

// Nueva función para desbloquear una lección
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

// Agregar la nueva función unlockNextLesson
export async function unlockNextLesson(currentLessonId: number): Promise<void> {
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
  }
}

