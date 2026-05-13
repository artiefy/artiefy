import { Suspense } from 'react';

import { type Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { auth, currentUser } from '@clerk/nextjs/server';

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
import type { CourseType } from '~/types';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const parseSubscriptionDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  const isoDate = new Date(dateString);
  if (!Number.isNaN(isoDate.getTime())) return isoDate;

  const matchSlash = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(dateString);
  if (matchSlash) {
    const [, year, month, day] = matchSlash;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
};

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
      {/* Preconnect al dominio S3 para reducir latencia en carga de videos */}
      <link rel="preconnect" href="https://s3.us-east-2.amazonaws.com" />
      <link rel="dns-prefetch" href="https://s3.us-east-2.amazonaws.com" />
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

    const user = await currentUser();
    const metadata = user?.publicMetadata as
      | {
          subscriptionStatus?: string;
          subscriptionEndDate?: string;
        }
      | undefined;
    const courseTypes: CourseType[] = [
      ...(course.courseType ? [course.courseType] : []),
      ...(Array.isArray(course.courseTypes) ? course.courseTypes : []),
    ];
    const requiresSubscription =
      courseTypes.length === 0
        ? course.requiresSubscription === true
        : courseTypes.some(
            (type) => (type.requiredSubscriptionLevel ?? 'none') !== 'none'
          );
    const hasPermanentEnrollment = Array.isArray(course.enrollments)
      ? course.enrollments.some(
          (enrollment) => enrollment.userId === userId && enrollment.isPermanent
        )
      : false;
    const subscriptionEndDate = parseSubscriptionDate(
      metadata?.subscriptionEndDate
    );
    const hasActiveSubscription =
      metadata?.subscriptionStatus === 'active' &&
      subscriptionEndDate !== null &&
      subscriptionEndDate > new Date();

    if (
      requiresSubscription &&
      !hasPermanentEnrollment &&
      !hasActiveSubscription
    ) {
      redirect('/planes');
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
        isLocked: false,
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
      isLocked: false,
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
