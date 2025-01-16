'use server';

import { auth } from '@clerk/nextjs/server';
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
} from '~/server/db/schema';
import {
  type Course,
  type Lesson,
  type Enrollment,
  type Category,
  type Preference,
  type Score,
  type CourseTaken,
  type Project,
  type ProjectTaken,
  type Activity,
} from '~/types';

// Función auxiliar para verificar la autenticación
async function checkAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('No autenticado');
  }
  return userId;
}

// Obtener todos los cursos disponibles
export async function getAllCourses(): Promise<Course[]> {
  await checkAuth();
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
  }));
}

// Obtener un curso específico por ID
export async function getCourseById(courseId: number): Promise<Course | null> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('No autenticado');
  }

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
    lessons:
      course.lessons?.map((lesson) => ({
        ...lesson,
        userProgress: lesson.userProgress ?? 0,
        isLocked: lesson.isLocked ?? true,
        isCompleted: lesson.isCompleted ?? false,
        porcentajecompletado: lesson.porcentajecompletado ?? 0,
        activities:
          lesson.activities?.map((activity) => ({
            ...activity,
            isCompleted: activity.isCompleted ?? false,
            userProgress: activity.userProgress ?? 0,
          })) ?? [],
      })) ?? [],
  };

  return transformedCourse;
}

// Inscribirse en un curso
export async function enrollInCourse(courseId: number): Promise<Enrollment> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  try {
    const existingEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    });

    if (existingEnrollment) {
      throw new Error('Ya estás inscrito en este curso');
    }

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
      throw new Error('Error al crear la inscripción');
    }

    return {
      id: newEnrollment.id,
      userId: newEnrollment.userId,
      courseId: newEnrollment.courseId,
      enrolledAt: newEnrollment.enrolledAt,
      completed: newEnrollment.completed ?? false,
    };
  } catch (error) {
    console.error('Error al inscribirse en el curso:', error);
    throw new Error('No se pudo completar la inscripción');
  }
}

// Obtener todas las lecciones de un curso
export async function getLessonsByCourseId(
  courseId: number
): Promise<Lesson[]> {
  await checkAuth();
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
  }));
}

// Obtener una lección específica por ID
export async function getLessonById(lessonId: number): Promise<Lesson | null> {
  await checkAuth();
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
export async function updateLessonProgress(
  lessonId: number,
  progress: number
): Promise<void> {
  await checkAuth();
  await db
    .update(lessons)
    .set({
      userProgress: progress,
      isCompleted: progress >= 100,
      lastUpdated: new Date(),
    })
    .where(eq(lessons.id, lessonId));
}

// Completar una actividad
export async function completeActivity(activityId: number): Promise<void> {
  await checkAuth();
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
  await checkAuth();
  return db.query.categories.findMany({
    orderBy: [desc(categories.name)],
  });
}

// Nueva acción para obtener las categorías destacadas
export async function getFeaturedCategories(limit = 6): Promise<Category[]> {
  await checkAuth();
  return db.query.categories.findMany({
    where: eq(categories.is_featured, true),
    orderBy: [desc(categories.name)],
    limit: limit,
    with: {
      courses: true,
    },
  });
}

// Guardar preferencias del usuario
export async function savePreferences(categoryIds: number[]): Promise<void> {
  const userId = await checkAuth();
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
export async function getUserPreferences(): Promise<Preference[]> {
  const userId = await checkAuth();
  return db.query.preferences.findMany({
    where: eq(preferences.userId, userId),
    with: {
      category: true,
    },
  });
}

// Guardar puntaje del usuario
export async function saveScore(
  categoryId: number,
  score: number
): Promise<void> {
  const userId = await checkAuth();
  await db.insert(scores).values({
    userId,
    categoryid: categoryId,
    score,
  });
}

// Obtener puntajes del usuario
export async function getUserScores(): Promise<Score[]> {
  const userId = await checkAuth();
  return db.query.scores.findMany({
    where: eq(scores.userId, userId),
    with: {
      category: true,
    },
  });
}

// Marcar un curso como tomado
export async function markCourseTaken(courseId: number): Promise<void> {
  const userId = await checkAuth();
  await db.insert(coursesTaken).values({
    userId,
    courseId,
  });
}

// Obtener cursos tomados por el usuario
export async function getUserCoursesTaken(): Promise<CourseTaken[]> {
  const userId = await checkAuth();
  return db.query.coursesTaken.findMany({
    where: eq(coursesTaken.userId, userId),
    with: {
      course: true,
    },
  });
}

// Obtener todos los proyectos disponibles
export async function getAllProjects(): Promise<Project[]> {
  await checkAuth();
  return db.query.projects.findMany({
    with: {
      category: true,
    },
  });
}

// Obtener un proyecto específico por ID
export async function getProjectById(
  projectId: number
): Promise<Project | null> {
  await checkAuth();
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      category: true,
    },
  });
  return project ?? null;
}

// Marcar un proyecto como tomado
export async function markProjectTaken(projectId: number): Promise<void> {
  const userId = await checkAuth();
  await db.insert(projectsTaken).values({
    userId,
    projectId,
  });
}

// Obtener proyectos tomados por el usuario
export async function getUserProjectsTaken(): Promise<ProjectTaken[]> {
  const userId = await checkAuth();
  return db.query.projectsTaken.findMany({
    where: eq(projectsTaken.userId, userId),
    with: {
      project: true,
    },
  });
}

// Obtener el progreso general del estudiante
export async function getStudentProgress(): Promise<{
  coursesCompleted: number;
  totalEnrollments: number;
  averageProgress: number;
}> {
  const userId = await checkAuth();
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

  return (
    result[0] ?? {
      coursesCompleted: 0,
      totalEnrollments: 0,
      averageProgress: 0,
    }
  );
}
