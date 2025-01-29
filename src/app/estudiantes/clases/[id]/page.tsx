import { notFound } from 'next/navigation';

import { getCourseById } from '~/server/actions/courses/getCourseById';
import { getLessonById } from '~/server/actions/lessons/getLessonById';
import { getLessonsByCourseId } from '~/server/actions/lessons/getLessonsByCourseId';
import { getUserLessonsProgress } from '~/server/actions/progress/getUserLessonsProgress';
import type {
  Activity,
  Lesson,
  Course,
  UserLessonsProgress,
  LessonWithProgress,
} from '~/types';

import LessonDetails from './LessonDetails';

interface Params {
  id: string;
}

interface Props {
  params: Promise<Params>;
}

export default async function LessonPage({ params }: Props) {
  const { id } = await params;
  return await LessonContent({ id });
}

async function LessonContent({ id }: { id: string }) {
  try {
    const lessonId = Number.parseInt(id, 10);
    if (isNaN(lessonId)) {
      notFound();
    }

    const lessonData: Lesson | null = await getLessonById(lessonId);
    if (!lessonData) {
      console.log('Lección no encontrada');
      notFound();
    }

    const lesson: LessonWithProgress = {
      ...lessonData,
      isLocked: lessonData.isLocked ?? false,
    };

    const activity: Activity | null = lesson.activities?.[0]
      ? {
          ...lesson.activities[0],
          isCompleted: lesson.activities[0].isCompleted ?? false,
          userProgress: lesson.activities[0].userProgress ?? 0,
        }
      : null;

    const course: Course | null = await getCourseById(lesson.courseId);
    if (!course) {
      console.log('Curso no encontrado');
      notFound();
    }

    const lessons: Lesson[] = await getLessonsByCourseId(lesson.courseId);
    const userLessonsProgress: UserLessonsProgress[] =
      await getUserLessonsProgress(course.creatorId);

    return (
      <LessonDetails
        lesson={lesson}
        activity={activity}
        lessons={lessons}
        course={course}
        userLessonsProgress={userLessonsProgress}
      />
    );
  } catch (error) {
    console.error(
      'Error al obtener los datos de la lección:',
      error instanceof Error ? error.message : String(error)
    );
    notFound();
  }
}
