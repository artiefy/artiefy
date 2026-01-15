import { Suspense } from 'react';

import { type Metadata } from 'next';
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

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

    // Obtener progreso real de todas las lecciones del curso
    const [lessons, userProgress] = await Promise.all([
      getLessonsByCourseId(lessonData.courseId, userId),
      getUserLessonsProgress(userId),
    ]);

    const { lessonsProgress = [], activitiesProgress = [] } =
      userProgress ?? {};

    // Mapear progreso real a cada lección
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
        isNew: lessonProgress?.isNew ?? true,
        activities: lessonItem.activities ?? [],
      };
    });

    // Ordenar las lecciones antes de pasarlas al componente
    const sortedLessonsWithProgress = sortLessons(lessonsWithProgress);

    // Now create lesson with course data and ensure all properties are initialized
    const lesson: LessonWithProgress = {
      ...lessonData,
      isLocked:
        lessonsProgress.find((p) => p.lessonId === lessonData.id)?.isLocked ??
        false,
      courseTitle: course.title,
      activities: lessonData.activities ?? [],
      porcentajecompletado:
        lessonsProgress.find((p) => p.lessonId === lessonData.id)?.progress ??
        0,
      isCompleted:
        lessonsProgress.find((p) => p.lessonId === lessonData.id)
          ?.isCompleted ?? false,
      isNew:
        lessonsProgress.find((p) => p.lessonId === lessonData.id)?.isNew ??
        true,
    };

    const activityContent = await getActivityContent(lessonId, userId);
    const activitiesWithProgress = (activityContent ?? []).map((activity) => ({
      ...activity,
      isCompleted: activity.isCompleted ?? false,
      userProgress: activity.userProgress ?? 0,
    }));

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
