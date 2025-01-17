import { notFound } from 'next/navigation';
import {
  getLessonById,
  getActivitiesByLessonId,
  getLessonsByCourseId,
  getCourseById,
} from '~/models/estudiantes/courseModelsStudent';
import LessonDetails from './LessonDetails';

interface Activity {
  id: number;
  name: string;
  description: string | null;
  tipo: string;
  completed: boolean;
}

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
    const lessonId = parseInt(id, 10);
    if (isNaN(lessonId)) {
      notFound();
    }

    const lesson = await getLessonById(lessonId);
    if (!lesson) {
      console.log('Lección no encontrada');
      notFound();
    }

    const activities = await getActivitiesByLessonId(lesson.id);
    const activity: Activity | null = activities?.[0] ?? null;

    const course = await getCourseById(lesson.courseId);
    if (!course) {
      console.log('Curso no encontrado');
      notFound();
    }

    const lessons = await getLessonsByCourseId(lesson.courseId);

    const userId = 'someUserId';

    return (
      <LessonDetails
        lesson={lesson}
        activity={activity}
        lessons={lessons}
        course={course}
        userId={userId}
      />
    );
  } catch (error) {
    console.error('Error al obtener los datos de la lección:', error);
    notFound();
  }
}
