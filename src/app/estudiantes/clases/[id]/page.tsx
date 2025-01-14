import { notFound } from 'next/navigation';
import VideoPlayer from '~/components/estudiantes/layout/VideoPlayer';
import { getLessonById } from '~/models/estudiantes/courseModelsStudent'; // Import the correct function

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

    return (
      <div>
        <section className="container mx-auto p-4">
          <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>
          <VideoPlayer videoKey={lesson.coverVideoKey} />
          <p className="mt-4">{lesson.description}</p>
          <p className="mt-4">Resource Key: {lesson.resourceKey}</p>
          <p className="mt-4">
            Porcentaje Completado: {lesson.porcentajecompletado}%
          </p>
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error fetching lesson:', error);
    notFound();
  }
}
