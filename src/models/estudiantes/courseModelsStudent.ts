//src\models\estudiantes\courseModelsStudent.ts
import { eq, count } from 'drizzle-orm';
import { and } from 'drizzle-orm/expressions';
import { db } from '~/server/db/index';
import {
  courses,
  lessons,
  enrollments,
  categories,
  modalidades,
  activities,
} from '~/server/db/schema';

export interface Lesson {
  id: number;
  title: string;
  duration: number;
  description: string | null;
  order: number;
  courseId: number;
  coverVideoKey: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  resourceKey: string;
  porcentajecompletado: number;
  userProgress: number;
  lastUpdated: string | number | Date;
  isCompleted: boolean;
  isLocked: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Modalidad {
  id: number;
  name: string;
  description: string | null;
}

export interface Course {
  id: number;
  title: string;
  description: string | null;
  creatorId: string;
  coverImageKey: string | null;
  categoryid: number;
  category: Category;
  instructor: string;
  rating: number | null;
  userId: string;
  modalidad: Modalidad;
  lessons?: Lesson[];
  totalStudents?: number;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface Activity {
  id: number;
  name: string;
  description: string | null;
  tipo: string;
  lessonsId: number;
  completed: boolean;
  userProgress: number;
  lastUpdated: string | number | Date;
  isCompleted: boolean;
}

// Crear un nuevo curso
export const createCourse = async ({
  title,
  description,
  creatorId,
  coverImageKey,
  categoryid,
  instructor,
  rating,
  modalidadesid,
  dificultadid,
}: {
  title: string;
  description: string;
  creatorId: string;
  coverImageKey: string;
  categoryid: number;
  instructor: string;
  rating: number;
  modalidadesid: number;
  dificultadid: number;
}): Promise<void> => {
  await db.insert(courses).values({
    title,
    description,
    creatorId,
    coverImageKey,
    categoryid,
    instructor,
    rating,
    modalidadesid,
    dificultadid,
  });
};

// Obtener todos los cursos de un profesor
export const getCoursesByUserId = async (userId: string): Promise<Course[]> => {
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.creatorId, userId));
  const categoriesResult = await db.select().from(categories);
  const categoriesMap = new Map(
    categoriesResult.map((category) => [category.id, category])
  );

  const modalidadesResult = await db.select().from(modalidades);
  const modalidadesMap = new Map(
    modalidadesResult.map((modalidad) => [modalidad.id, modalidad])
  );

  return result.map((course) => ({
    ...course,
    coverImageKey: course.coverImageKey,
    userId: course.creatorId,
    category: categoriesMap.get(course.categoryid) ?? {
      id: course.categoryid,
      name: '',
      description: null,
    },
    modalidad: modalidadesMap.get(course.modalidadesid) ?? {
      id: course.modalidadesid,
      name: '',
      description: null,
    },
  }));
};

// Obtener todas las lecciones por ID de curso
export const getLessonsByCourseId = async (
  courseId: number
): Promise<Lesson[]> => {
  const lessonsResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);
  return lessonsResult.map((lesson) => ({
    ...lesson,
    courseId: lesson.courseId,
    duration: lesson.duration,
    coverVideoKey: lesson.coverVideoKey,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    resourceKey: lesson.resourceKey,
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.order === 1 ? false : (lesson.isLocked ?? true),
    userProgress: lesson.userProgress ?? 0,
    isCompleted: lesson.isCompleted ?? false,
    lastUpdated: new Date(),
  }));
};

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (courseId: number): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollments)
    .where(eq(enrollments.courseId, courseId));

  if (result[0] instanceof Error) {
    throw new Error(result[0].message); // Ensure the error is properly typed
  }

  return result[0]?.totalStudents ?? 0;
};

// Obtener un curso por ID
export const getCourseById = async (
  courseId: number
): Promise<Course | null> => {
  const courseResult = await db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId));
  if (courseResult.length === 0) return null;

  const courseData = courseResult[0];
  if (!courseData) return null;
  const course = {
    ...courseData,
    coverImageKey: courseData.coverImageKey,
    userId: courseData.creatorId,
    category: { id: courseData.categoryid, name: '', description: null },
    modalidad: {
      id: courseData.modalidadesid,
      name: '',
      description: null,
    },
  } as Course;

  const categoryResult = await db
    .select()
    .from(categories)
    .where(eq(categories.id, course.categoryid));
  if (categoryResult.length > 0 && categoryResult[0]) {
    course.category = categoryResult[0];
  } else {
    course.category = {
      id: course.categoryid,
      name: '',
      description: null,
    };
  }

  const modalidadResult = await db
    .select()
    .from(modalidades)
    .where(eq(modalidades.id, courseData.modalidadesid));
  if (modalidadResult.length > 0 && modalidadResult[0]) {
    course.modalidad = modalidadResult[0];
  } else {
    course.modalidad = {
      id: courseData.modalidadesid,
      name: '',
      description: null,
    };
  }

  const lessonsResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);
  course.lessons = lessonsResult.map((lesson) => ({
    ...lesson,
    courseId: lesson.courseId,
    duration: lesson.duration,
    coverVideoKey: lesson.coverVideoKey,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    resourceKey: lesson.resourceKey,
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.order === 1 ? false : (lesson.isLocked ?? false),
    userProgress: lesson.userProgress ?? 0,
    isCompleted: lesson.isCompleted ?? false,
    lastUpdated: new Date().toISOString(),
  }));

  // Obtener el número total de estudiantes inscritos
  course.totalStudents = await getTotalStudents(courseId);

  return course;
};

// Obtener una lección por ID
export const getLessonById = async (
  lessonId: number
): Promise<Lesson | null> => {
  const lessonResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId));
  if (lessonResult.length === 0) return null;

  const lessonData = lessonResult[0];
  if (!lessonData) return null;

  return {
    ...lessonData,
    courseId: lessonData.courseId,
    duration: lessonData.duration,
    coverVideoKey: lessonData.coverVideoKey,
    createdAt: lessonData.createdAt.toISOString(),
    updatedAt: lessonData.updatedAt.toISOString(),
    resourceKey: lessonData.resourceKey,
    porcentajecompletado: lessonData.porcentajecompletado ?? 0,
    isLocked: lessonData.isLocked ?? false,
    userProgress: lessonData.userProgress ?? 0,
    isCompleted: lessonData.isCompleted ?? false,
    lastUpdated: new Date().toISOString(),
  };
};

// Obtener actividades por ID de lección
export const getActivitiesByLessonId = async (
  lessonId: number
): Promise<Activity[]> => {
  const activitiesResult = await db
    .select()
    .from(activities)
    .where(eq(activities.lessonsId, lessonId));
  return activitiesResult.map((activity) => ({
    id: activity.id,
    name: activity.name,
    description: activity.description,
    tipo: activity.tipo,
    lessonsId: activity.lessonsId,
    completed: activity.isCompleted ?? false,
    userProgress: activity.userProgress ?? 0,
    isCompleted: activity.isCompleted ?? false,
    lastUpdated: activity.lastUpdated.toISOString(),
  }));
};

// Obtener todos los cursos
export const getAllCourses = async (): Promise<Course[]> => {
  const result = await db.select().from(courses);
  const categoriesResult = await db.select().from(categories);
  const categoriesMap = new Map(
    categoriesResult.map((category) => [category.id, category])
  );

  const modalidadesResult = await db.select().from(modalidades);
  const modalidadesMap = new Map(
    modalidadesResult.map((modalidad) => [modalidad.id, modalidad])
  );

  return result.map((course) => ({
    ...course,
    coverImageKey: course.coverImageKey,
    userId: course.creatorId,
    category: categoriesMap.get(course.categoryid) ?? {
      id: course.categoryid,
      name: '',
      description: null,
    },
    modalidad: modalidadesMap.get(course.modalidadesid) ?? {
      id: course.modalidadesid,
      name: '',
      description: null,
    },
  }));
};

// Actualizar un curso
export const updateCourse = async (
  courseId: number,
  {
    title,
    description,
    coverImageKey,
    categoryid,
    instructor,
    rating,
    modalidadesid,
  }: {
    title: string;
    description: string;
    coverImageKey: string;
    categoryid: number;
    instructor: string;
    rating: number;
    modalidadesid: number;
  }
): Promise<void> => {
  await db
    .update(courses)
    .set({
      title,
      description,
      coverImageKey,
      categoryid,
      instructor,
      rating,
      modalidadesid,
    }) // Map to database column
    .where(eq(courses.id, courseId));
};

// Eliminar un curso
export const deleteCourse = async (courseId: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, courseId));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, courseId));
};

// Obtener el progreso de una lección para un usuario específico
export const getLessonProgress = async (lessonId: number): Promise<number> => {
  const result = await db
    .select({ progress: lessons.userProgress })
    .from(lessons)
    .where(eq(lessons.id, lessonId));

  return result[0]?.progress ?? 0;
};

// Actualizar el progreso de una lección para un usuario específico
export const updateLessonProgress = async (
  lessonId: number,
  progress: number
): Promise<void> => {
  await db
    .update(lessons)
    .set({ userProgress: progress, lastUpdated: new Date() })
    .where(eq(lessons.id, lessonId));
};

// Marcar una lección como completada
export const completeLessonProgress = async (
  lessonId: number
): Promise<void> => {
  await updateLessonProgress(lessonId, 100);
  await db
    .update(lessons)
    .set({ isCompleted: true, lastUpdated: new Date() })
    .where(eq(lessons.id, lessonId));
};

// Obtener el estado de completado de una actividad para un usuario específico
export const getActivityCompletion = async (
  activityId: number
): Promise<boolean> => {
  const result = await db
    .select({ completed: activities.isCompleted })
    .from(activities)
    .where(eq(activities.id, activityId));

  return result[0]?.completed ?? false;
};

// Marcar una actividad como completada
export const completeActivity = async (activityId: number): Promise<void> => {
  await db
    .update(activities)
    .set({ isCompleted: true, lastUpdated: new Date() })
    .where(eq(activities.id, activityId));
};

// Verificar si una lección está desbloqueada para un usuario
export const isLessonUnlocked = async (lessonId: number): Promise<boolean> => {
  const lesson = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);

  if (lesson.length === 0) return false;

  if (lesson[0] && lesson[0].order === 1) return true;

  const previousLessonId = lesson[0] ? lesson[0].order - 1 : 0;
  const previousLessonProgress = await db
    .select()
    .from(lessons)
    .where(
      and(eq(lessons.id, previousLessonId), eq(lessons.isCompleted, true))
    );

  return previousLessonProgress.length > 0;
};

// Desbloquear la siguiente lección
export const unlockNextLesson = async (
  currentLessonId: number
): Promise<void> => {
  const currentLesson = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, currentLessonId))
    .limit(1);

  if (currentLesson.length === 0) return;

  const nextLessonOrder = currentLesson[0] ? currentLesson[0].order + 1 : 0;
  const nextLesson = await db
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.courseId, currentLesson[0]?.courseId ?? 0),
        eq(lessons.order, nextLessonOrder)
      )
    )
    .limit(1);

  if (nextLesson.length === 0) return;

  await db
    .update(lessons)
    .set({ isLocked: false })
    .where(eq(lessons.id, nextLesson[0]?.id ?? 0));
};

// Obtener todas las lecciones de un curso con su estado de desbloqueo para un usuario específico
export const getLessonsByCourseIdWithUnlockStatus = async (
  _userId: string,
  courseId: number
): Promise<(Lesson & { isUnlocked: boolean })[]> => {
  const lessonsResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);

  const lessonsWithUnlockStatus = await Promise.all(
    lessonsResult.map(async (lesson) => {
      const isUnlocked = await isLessonUnlocked(lesson.id);
      return {
        ...lesson,
        courseId: lesson.courseId,
        duration: lesson.duration,
        coverVideoKey: lesson.coverVideoKey,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
        resourceKey: lesson.resourceKey,
        porcentajecompletado: lesson.porcentajecompletado ?? 0,
        isLocked: lesson.isLocked ?? false,
        userProgress: lesson.userProgress ?? 0,
        isCompleted: lesson.isCompleted ?? false,
        isUnlocked,
        lastUpdated: lesson.lastUpdated.toISOString(),
      };
    })
  );

  return lessonsWithUnlockStatus;
};
