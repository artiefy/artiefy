'use server'

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
  categories
} from '~/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
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
  type Activity
} from '~/types';

// Función auxiliar para verificar la autenticación
async function checkAuth() {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }
  return userId;
}

// Obtener todos los cursos disponibles (públicamente accesible)
export async function getAllCourses(): Promise<Course[]> {
  const coursesData = await db.query.courses.findMany({
    with: {
      category: true,
      modalidad: true,
      dificultad: true,
      enrollments: true,
    },
  });
  return coursesData.map(course => ({
    ...course,
    enrollments: course.enrollments?.map(enrollment => ({
      ...enrollment,
      completed: enrollment.completed ?? false,
    })) ?? [],
  }));
}

// Obtener un curso específico por ID (públicamente accesible)
export async function getCourseById(courseId: number): Promise<Course | null> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      category: true,
      modalidad: true,
      dificultad: true,
      enrollments: true,
    },
  });
  if (!course) return null;
  return {
    ...course,
    enrollments: course.enrollments?.map(enrollment => ({
      ...enrollment,
      completed: enrollment.completed ?? false,
    })) ?? [],
  };
}

// Inscribirse en un curso (requiere autenticación)
export async function enrollInCourse(courseId: number): Promise<Enrollment | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  const existingEnrollment = await db.query.enrollments.findFirst({
    where: and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courseId)
    ),
  });

  if (existingEnrollment) {
    throw new Error('Ya estás inscrito en este curso');
  }

  const [enrollment] = await db.insert(enrollments).values({
    userId,
    courseId,
    enrolledAt: new Date(),
    completed: false,
  }).returning();

  return enrollment ?? null;
}

// Obtener todas las lecciones de un curso (requiere autenticación)
export async function getLessonsByCourseId(courseId: number): Promise<Lesson[] | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  const lessonsData = await db.query.lessons.findMany({
    where: eq(lessons.courseId, courseId),
    orderBy: [desc(lessons.order)],
    with: {
      activities: true,
    },
  });
  return lessonsData.map(lesson => ({
    ...lesson,
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.isLocked ?? true,
    userProgress: lesson.userProgress ?? 0,
    isCompleted: lesson.isCompleted ?? false,
    activities: lesson.activities?.map(activity => ({
      ...activity,
      isCompleted: activity.isCompleted ?? false,
      userProgress: activity.userProgress ?? 0,
    })),
  }));
}

// Obtener una lección específica por ID (requiere autenticación)
export async function getLessonById(lessonId: number): Promise<Lesson | null> {
  const userId = await checkAuth();
  if (!userId) return null;

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
    activities: (lesson.activities as Activity[] | undefined)?.map(activity => ({
      ...activity,
      isCompleted: activity.isCompleted ?? false,
      userProgress: activity.userProgress ?? 0,
    })) ?? [],
  };
}

// Actualizar el progreso de una lección (requiere autenticación)
export async function updateLessonProgress(lessonId: number, progress: number): Promise<void | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  await db.update(lessons)
    .set({ 
      userProgress: progress,
      isCompleted: progress >= 100,
      lastUpdated: new Date(),
    })
    .where(eq(lessons.id, lessonId));
}

// Completar una actividad (requiere autenticación)
export async function completeActivity(activityId: number): Promise<void | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  await db.update(activities)
    .set({ 
      isCompleted: true,
      userProgress: 100,
      lastUpdated: new Date(),
    })
    .where(eq(activities.id, activityId));
}

// Obtener todas las categorías (públicamente accesible)
export async function getAllCategories(): Promise<Category[]> {
  return db.query.categories.findMany({
    orderBy: [desc(categories.name)],
  });
}

// Obtener las categorías destacadas (públicamente accesible)
export async function getFeaturedCategories(limit = 6): Promise<Category[]> {
  return db.query.categories.findMany({
    where: eq(categories.is_featured, true),
    orderBy: [desc(categories.name)],
    limit: limit,
    with: {
      courses: true,
    },
  });
}

// Las siguientes funciones requieren autenticación y devolverán null si el usuario no está autenticado

export async function savePreferences(categoryIds: number[]): Promise<void | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  await db.delete(preferences).where(eq(preferences.userId, userId));
  await db.insert(preferences).values(
    categoryIds.map(categoryId => ({
      userId,
      categoryid: categoryId,
      name: '',
    }))
  );
}

export async function getUserPreferences(): Promise<Preference[] | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  return db.query.preferences.findMany({
    where: eq(preferences.userId, userId),
    with: {
      category: true,
    },
  });
}

export async function saveScore(categoryId: number, score: number): Promise<void | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  await db.insert(scores).values({
    userId,
    categoryid: categoryId,
    score,
  });
}

export async function getUserScores(): Promise<Score[] | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  return db.query.scores.findMany({
    where: eq(scores.userId, userId),
    with: {
      category: true,
    },
  });
}

export async function markCourseTaken(courseId: number): Promise<void | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  await db.insert(coursesTaken).values({
    userId,
    courseId,
  });
}

export async function getUserCoursesTaken(): Promise<CourseTaken[] | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  return db.query.coursesTaken.findMany({
    where: eq(coursesTaken.userId, userId),
    with: {
      course: true,
    },
  });
}

export async function getAllProjects(): Promise<Project[] | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  return db.query.projects.findMany({
    with: {
      category: true,
    },
  });
}

export async function getProjectById(projectId: number): Promise<Project | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      category: true,
    },
  });
  return project ?? null;
}

export async function markProjectTaken(projectId: number): Promise<void | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  await db.insert(projectsTaken).values({
    userId,
    projectId,
  });
}

export async function getUserProjectsTaken(): Promise<ProjectTaken[] | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  return db.query.projectsTaken.findMany({
    where: eq(projectsTaken.userId, userId),
    with: {
      project: true,
    },
  });
}

// Obtener el progreso general del estudiante (requiere autenticación)
export async function getStudentProgress(): Promise<{ 
  coursesCompleted: number, 
  totalEnrollments: number,
  averageProgress: number 
} | null> {
  const userId = await checkAuth();
  if (!userId) return null;

  const result = await db.select({
    coursesCompleted: sql<number>`COUNT(CASE WHEN ${enrollments.completed} = true THEN 1 END)`,
    totalEnrollments: sql<number>`COUNT(*)`,
    averageProgress: sql<number>`AVG(${lessons.userProgress})`,
  })
  .from(enrollments)
  .leftJoin(lessons, eq(enrollments.courseId, lessons.courseId))
  .where(eq(enrollments.userId, userId))
  .groupBy(enrollments.userId);

  return result[0] ?? { coursesCompleted: 0, totalEnrollments: 0, averageProgress: 0 };
}

