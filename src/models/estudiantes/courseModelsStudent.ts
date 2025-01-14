//src\models\estudiantes\courseModelsStudent.ts
import { eq, count } from 'drizzle-orm';
import { db } from '~/server/db/index';
import {
  courses,
  lessons,
  enrollments,
  categories,
  modalidades,
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

// Obtener el número total de estudiantes inscritos en un curso
export const getTotalStudents = async (course_id: number): Promise<number> => {
  const result = await db
    .select({ totalStudents: count() })
    .from(enrollments)
    .where(eq(enrollments.courseId, course_id));
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
    coverVideoKey: lesson.coverVideoKey, // Map from database column
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    resourceKey: lesson.resourceKey,
    porcentajecompletado: lesson.porcentajecompletado ?? 0,
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
  };
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
