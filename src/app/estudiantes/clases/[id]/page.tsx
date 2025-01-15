import { notFound } from 'next/navigation';
import { getLessonById } from '~/models/estudiantes/courseModelsStudent';
import LessonDetails from './LessonDetails';

interface Props {
  params: { id: string };
}

export default function Page({ params }: Props) {
  const { id } = params;

  return <PageContent id={id} />;
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

    return <LessonDetails lesson={lesson} />;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    notFound();
  }
}
