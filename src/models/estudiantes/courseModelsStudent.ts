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
  lessonProgress,
  activityProgress,
} from '~/server/db/schema';

export interface Lesson {
  id: number;
  title: string;
  duration: number;
  description: string | null;
  order: number;
  course_id: number;
  coverVideoKey: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  resourceKey: string;
  porcentajecompletado: number;
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
  user_id: string;
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
export const getCoursesByUserId = async (
  user_id: string
): Promise<Course[]> => {
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.creatorId, user_id));
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
    user_id: course.creatorId,
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
  course_id: number
): Promise<Lesson[]> => {
  const lessonsResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, course_id))
    .orderBy(lessons.order);
  return lessonsResult.map((lesson) => ({
    ...lesson,
    course_id: lesson.courseId,
    duration: lesson.duration,
    coverVideoKey: lesson.coverVideoKey,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    resourceKey: lesson.resourceKey,
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.order === 1 ? false : (lesson.isLocked ?? true),
  }));
};

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (course_id: number): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollments)
    .where(eq(enrollments.courseId, course_id));
  if (result[0] instanceof Error) {
    throw result[0];
  }
  return result[0]?.totalStudents ?? 0;
};

// Obtener un curso por ID
export const getCourseById = async (
  course_id: number
): Promise<Course | null> => {
  const courseResult = await db
    .select()
    .from(courses)
    .where(eq(courses.id, course_id));
  if (courseResult.length === 0) return null;

  const courseData = courseResult[0];
  if (!courseData) return null;
  const course = {
    ...courseData,
    coverImageKey: courseData.coverImageKey,
    user_id: courseData.creatorId,
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
    .where(eq(lessons.courseId, course_id))
    .orderBy(lessons.order);
  course.lessons = lessonsResult.map((lesson) => ({
    ...lesson,
    course_id: lesson.courseId,
    duration: lesson.duration,
    coverVideoKey: lesson.coverVideoKey,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    resourceKey: lesson.resourceKey,
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
    isLocked: lesson.order === 1 ? false : (lesson.isLocked ?? false),
  }));

  // Obtener el número total de estudiantes inscritos
  course.totalStudents = await getTotalStudents(course_id);

  return course;
};

// Obtener una lección por ID
export const getLessonById = async (
  lesson_id: number
): Promise<Lesson | null> => {
  const lessonResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.id, lesson_id));
  if (lessonResult.length === 0) return null;

  const lessonData = lessonResult[0];
  if (!lessonData) return null;

  return {
    ...lessonData,
    course_id: lessonData.courseId,
    duration: lessonData.duration,
    coverVideoKey: lessonData.coverVideoKey,
    createdAt: lessonData.createdAt.toISOString(),
    updatedAt: lessonData.updatedAt.toISOString(),
    resourceKey: lessonData.resourceKey,
    porcentajecompletado: lessonData.porcentajecompletado ?? 0,
    isLocked: lessonData.isLocked ?? false,
  };
};

// Obtener actividades por ID de lección
export const getActivitiesByLessonId = async (
  lesson_id: number
): Promise<Activity[]> => {
  const activitiesResult = await db
    .select()
    .from(activities)
    .where(eq(activities.lessonsId, lesson_id));
  return activitiesResult.map((activity) => ({
    id: activity.id,
    name: activity.name,
    description: activity.description,
    tipo: activity.tipo,
    lessonsId: activity.lessonsId,
    completed: activity.isCompleted ?? false,
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
    user_id: course.creatorId,
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
  course_id: number,
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
    .where(eq(courses.id, course_id));
};

// Eliminar un curso
export const deleteCourse = async (course_id: number): Promise<void> => {
  // Primero eliminar las lecciones asociadas al curso
  await db.delete(lessons).where(eq(lessons.courseId, course_id));

  // Luego eliminar el curso
  await db.delete(courses).where(eq(courses.id, course_id));
};

// Obtener el progreso de una lección para un usuario específico
export const getLessonProgress = async (
  userId: string,
  lessonId: number
): Promise<number> => {
  const result = await db
    .select({ progress: lessonProgress.progress })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      )
    );

  return result[0]?.progress ?? 0;
};

// Actualizar el progreso de una lección para un usuario específico
export const updateLessonProgress = async (
  userId: string,
  lessonId: number,
  progress: number
): Promise<void> => {
  const existingProgress = await db
    .select()
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      )
    );

  if (existingProgress.length > 0) {
    await db
      .update(lessonProgress)
      .set({ progress, lastUpdated: new Date() })
      .where(
        and(
          eq(lessonProgress.userId, userId),
          eq(lessonProgress.lessonId, lessonId)
        )
      );
  } else {
    await db
      .insert(lessonProgress)
      .values({ userId, lessonId, progress, lastUpdated: new Date() });
  }
};

// Marcar una lección como completada
export const completeLessonProgress = async (
  userId: string,
  lessonId: number
): Promise<void> => {
  await updateLessonProgress(userId, lessonId, 100);
  await db
    .update(lessonProgress)
    .set({ completed: true, lastUpdated: new Date() })
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, lessonId)
      )
    );
};

// Obtener el estado de completado de una actividad para un usuario específico
export const getActivityCompletion = async (
  userId: string,
  activityId: number
): Promise<boolean> => {
  const result = await db
    .select({ completed: activityProgress.completed })
    .from(activityProgress)
    .where(
      and(
        eq(activityProgress.userId, userId),
        eq(activityProgress.activityId, activityId)
      )
    );

  return result[0]?.completed ?? false;
};

// Marcar una actividad como completada
export const completeActivity = async (
  userId: string,
  activityId: number
): Promise<void> => {
  const existingProgress = await db
    .select()
    .from(activityProgress)
    .where(
      and(
        eq(activityProgress.userId, userId),
        eq(activityProgress.activityId, activityId)
      )
    );

  if (existingProgress.length > 0) {
    await db
      .update(activityProgress)
      .set({ completed: true, lastUpdated: new Date() })
      .where(
        and(
          eq(activityProgress.userId, userId),
          eq(activityProgress.activityId, activityId)
        )
      );
  } else {
    await db
      .insert(activityProgress)
      .values({ userId, activityId, completed: true, lastUpdated: new Date() });
  }
};

// Verificar si una lección está desbloqueada para un usuario
export const isLessonUnlocked = async (
  userId: string,
  lessonId: number
): Promise<boolean> => {
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
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.lessonId, previousLessonId),
        eq(lessonProgress.completed, true)
      )
    );

  return previousLessonProgress.length > 0;
};

// Desbloquear la siguiente lección
export const unlockNextLesson = async (
  _userId: string,
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
  userId: string,
  courseId: number
): Promise<(Lesson & { isUnlocked: boolean })[]> => {
  const lessonsResult = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(lessons.order);

  const lessonsWithUnlockStatus = await Promise.all(
    lessonsResult.map(async (lesson) => {
      const isUnlocked = await isLessonUnlocked(userId, lesson.id);
      return {
        ...lesson,
        course_id: lesson.courseId,
        duration: lesson.duration,
        coverVideoKey: lesson.coverVideoKey,
        createdAt: lesson.createdAt.toISOString(),
        updatedAt: lesson.updatedAt.toISOString(),
        resourceKey: lesson.resourceKey,
        porcentajecompletado: lesson.porcentajecompletado ?? 0,
        isLocked: lesson.isLocked ?? false,
        isUnlocked,
      };
    })
  );

  return lessonsWithUnlockStatus;
};
