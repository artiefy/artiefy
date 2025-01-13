import { eq } from 'drizzle-orm';
import { db } from '~/server/db/index';
import { lessons } from '~/server/db/schema';

interface Lesson {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    title: string;
    description: string | null;
    courseId: number;
    duration: number;
    order: number;
    coverVideoKey: string;
}

export const getLessonById = async (
    lesson_id: number
): Promise<Lesson | null> => {
    const result = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, lesson_id));
    if (result.length === 0) return null;

    const lessonData = result[0];
    if (!lessonData) return null;
    return {
        id: lessonData.id,
        title: lessonData.title,
        description: lessonData.description,
        coverVideoKey: lessonData.coverVideoKey,
        createdAt: new Date(lessonData.createdAt),
        updatedAt: new Date(lessonData.updatedAt),
        courseId: lessonData.courseId,
        duration: lessonData.duration,
        order: lessonData.order,
    };
};
