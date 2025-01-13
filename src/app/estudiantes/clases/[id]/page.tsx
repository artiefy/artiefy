import { use } from 'react';
import { notFound } from 'next/navigation';
import VideoPlayer from '~/components/estudiantes/VideoPlayer';
import { getLessonById } from '~/models/estudiantes/lessonModelsStudent';

interface Props {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: Props) {
    const { id } = use(params);

    return <PageContent id={id} />;
}

async function PageContent({ id }: { id: string }) {
    try {
        const lesson = await getLessonById(Number(id));
        if (!lesson) {
            notFound();
        }

        return (
            <div>
                <section className="container mx-auto p-4">
                    <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>
                    <VideoPlayer videoKey={lesson.coverVideoKey} />
                    <p className="mt-4">{lesson.description}</p>
                    {/* Add any other fields from the lesson object if needed */}
                </section>
            </div>
        );
    } catch (error) {
        console.error('Error fetching lesson:', error);
        notFound();
    }
}
