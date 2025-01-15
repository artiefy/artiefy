import { notFound } from 'next/navigation';
import {
  getLessonById,
  getActivitiesByLessonId,
  getLessonsByCourseId,
} from '~/models/estudiantes/courseModelsStudent';
import LessonDetails from './LessonDetails';

interface Params {
  id: string;
}

interface Props {
  params: Promise<Params>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;

  return await PageContent({ id });
}

async function PageContent({ id }: { id: string }) {
  try {
    console.log('Fetching lesson with id:', id);
    const lesson = await getLessonById(Number(id)).catch((error) => {
      console.error('Error fetching lesson:', error);
      notFound();
    });
    if (!lesson) {
      console.log('Lesson not found');
      notFound();
    }

    const activities = await getActivitiesByLessonId(lesson.id);
    const lessons = await getLessonsByCourseId(lesson.course_id);

    return (
      <LessonDetails
        lesson={lesson}
        activities={activities}
        lessons={lessons}
      />
    );
  } catch (error) {
    console.error('Error fetching lesson:', error);
    notFound();
  }
}
