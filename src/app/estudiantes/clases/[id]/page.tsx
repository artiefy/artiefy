import { Suspense } from 'react';

import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { LessonSkeleton } from '~/components/estudiantes/layout/lessondetail/LessonDetailsSkeleton';
import { getActivityContent } from '~/server/actions/estudiantes/activities/getActivityContent';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { getLessonById } from '~/server/actions/estudiantes/lessons/getLessonById';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import { getUserLessonsProgress } from '~/server/actions/estudiantes/progress/getUserLessonsProgress';
import { sortLessons } from '~/utils/lessonSorting';

import LessonDetails from './LessonDetails';

import type { LessonWithProgress } from '~/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  const { userId, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<LessonSkeleton />}>
          <LessonContent id={id} userId={userId} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

// Move LessonContent to a separate file for better organization
async function LessonContent({ id, userId }: { id: string; userId: string }) {
  try {
    const lessonId = Number.parseInt(id, 10);
    if (isNaN(lessonId)) {
      return notFound();
    }

    const lessonData = await getLessonById(lessonId, userId);
    if (!lessonData) {
      console.log('Lección no encontrada');
      return notFound();
    }

    // Get course first to check if it's free
    const course = await getCourseById(lessonData.courseId, userId);
    if (!course) {
      console.log('Curso no encontrado');
      return notFound();
    }

    // Now create lesson with course data and ensure all properties are initialized
    const lesson: LessonWithProgress = {
      ...lessonData,
      isLocked: lessonData.isLocked ?? false,
      courseTitle: course.title,
      activities: lessonData.activities ?? [], // Initialize activities array
      porcentajecompletado: lessonData.porcentajecompletado ?? 0,
      isCompleted: lessonData.isCompleted ?? false,
      isNew: lessonData.isNew ?? true,
    };

    const activityContent = await getActivityContent(lessonId, userId);
    const activitiesWithProgress = (activityContent ?? []).map((activity) => ({
      ...activity,
      isCompleted: activity.isCompleted ?? false,
      userProgress: activity.userProgress ?? 0,
    }));

    const [lessons, userProgress] = await Promise.all([
      getLessonsByCourseId(lesson.courseId, userId),
      getUserLessonsProgress(userId),
    ]);

    const { lessonsProgress = [], activitiesProgress = [] } =
      userProgress ?? {};

    // Add null checks here
    const lessonsWithProgress = (lessons ?? []).map((lessonItem) => {
      const lessonProgress = lessonsProgress.find(
        (progress) => progress.lessonId === lessonItem.id
      );

      return {
        ...lessonItem,
        courseTitle: course.title,
        porcentajecompletado: lessonProgress?.progress ?? 0,
        isLocked: lessonProgress?.isLocked ?? true,
        isCompleted: lessonProgress?.isCompleted ?? false,
        activities: lessonItem.activities ?? [], // Ensure activities is initialized
      };
    });

    // Ordenar las lecciones antes de pasarlas al componente
    const sortedLessonsWithProgress = sortLessons(lessonsWithProgress);

    return (
      <LessonDetails
        lesson={lesson}
        activities={activitiesWithProgress}
        lessons={sortedLessonsWithProgress}
        userLessonsProgress={lessonsProgress}
        userActivitiesProgress={activitiesProgress}
        userId={userId}
        course={course}
      />
    );
  } catch (error: unknown) {
    console.error(
      'Error al obtener los datos de la lección:',
      error instanceof Error ? error.message : String(error)
    );
    return notFound();
  }
}
