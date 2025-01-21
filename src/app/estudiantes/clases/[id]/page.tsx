import { notFound } from 'next/navigation';
import {
    getLessonById,
    getLessonsByCourseId,
    getCourseById,
} from '~/server/actions/studentActions';
import { type Activity } from '~/types';
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
        const lessonId = parseInt(id, 10);
        if (isNaN(lessonId)) {
            notFound();
        }

        const lesson = await getLessonById(lessonId);
        if (!lesson) {
            console.log('Lección no encontrada');
            notFound();
        }

        const activity: Activity | null = lesson.activities?.[0]
            ? {
                    ...lesson.activities[0],
                    isCompleted: lesson.activities[0].isCompleted ?? false, // Ensure isCompleted is boolean
                    userProgress: lesson.activities[0].userProgress ?? 0, // Ensure userProgress is number
                }
            : null;

        const course = await getCourseById(lesson.courseId);
        if (!course) {
            console.log('Curso no encontrado');
            notFound();
        }

        const lessons = await getLessonsByCourseId(lesson.courseId);

        return (
            <LessonDetails
                lesson={lesson}
                activity={activity}
                lessons={lessons}
                course={course}
            />
        );
    } catch (error) {
        console.error('Error al obtener los datos de la lección:', error);
        notFound();
    }
}
