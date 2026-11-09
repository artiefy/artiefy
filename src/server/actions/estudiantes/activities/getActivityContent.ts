'use server';

import { eq } from 'drizzle-orm';

import { getRelatedActivities } from '~/server/actions/estudiantes/activities/getRelatedActivities';
import { canAccessCourseActivities } from '~/server/activities/courseAccess';
import { toPublicQuestion } from '~/server/activities/gradeAnswers';
import { loadActivityQuestionBank } from '~/server/activities/questionBank';
import { db } from '~/server/db';
import { lessons } from '~/server/db/schema';
import { getApiSession } from '~/server/utils/apiAuth';

import { getUserActivityProgress } from './getUserActivityProgress';

import type { Activity, Question } from '~/types';

/**
 * Activities of a lesson, with their questions, for the signed-in user.
 *
 * Security best practice: this is a server action callable from the browser,
 * so the user is taken from the session (never from a parameter), access to
 * the lesson's course is checked, and answer keys are stripped from every
 * question (grading happens server-side in `/api/activities/saveAnswers`).
 * Callers without access get an empty list, like a lesson without activities.
 */
const getActivityContent = async (lessonId: number): Promise<Activity[]> => {
  if (!Number.isFinite(lessonId)) return [];

  const session = await getApiSession();
  const userId = session.userId;
  if (!userId) return [];

  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    columns: { courseId: true },
  });
  if (!lesson) return [];

  const hasAccess = await canAccessCourseActivities(session, lesson.courseId);
  if (!hasAccess) return [];

  const dbActivities = await getRelatedActivities(lessonId);
  if (dbActivities.length === 0) return [];

  // Map database activities to Activity interface with default values for missing fields
  const relatedActivities: Activity[] = dbActivities.map((dbActivity) => ({
    ...dbActivity,
    isCompleted: false,
    userProgress: 0,
    attemptLimit: 0,
    currentAttempts: 0,
  }));

  const userProgress = await getUserActivityProgress(userId);

  return Promise.all(
    relatedActivities.map(async (activity: Activity, index: number) => {
      // Para actividades tipo documento no se consultan bancos de preguntas.
      const questions: Question[] =
        activity.typeid === 1
          ? []
          : (await loadActivityQuestionBank(activity.id).catch(() => [])).map(
              toPublicQuestion
            );

      const activityProgress = userProgress.find(
        (progress: (typeof userProgress)[number]) =>
          progress.activityId === activity.id
      );

      const isLastActivityInLesson = index === relatedActivities.length - 1;

      return {
        ...activity,
        content: {
          questions,
        },
        isCompleted: activityProgress?.isCompleted ?? false,
        userProgress: activityProgress?.progress ?? 0,
        createdAt: activity.lastUpdated,
        isLastInLesson: isLastActivityInLesson,
      } as unknown as Activity;
    })
  );
};

export { getActivityContent };
