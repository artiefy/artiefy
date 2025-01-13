import { eq } from 'drizzle-orm';
import { db } from '~/server/db/index';
import { lessons } from '~/server/db/schema';

export interface Lesson {
    id: number;
    title: string;
    description: string | null;
    coverVideoKey: string;
    createdAt: string | number | Date;
    updatedAt: string | number | Date;
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
        createdAt: new Date(lessonData.createdAt).toISOString(),
        updatedAt: new Date(lessonData.updatedAt).toISOString(),
    };
};
