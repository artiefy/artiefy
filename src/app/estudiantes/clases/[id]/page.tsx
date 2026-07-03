import { Suspense } from 'react';

import { type Metadata } from 'next';
import { notFound, redirect, unstable_rethrow } from 'next/navigation';

import { auth, currentUser } from '@clerk/nextjs/server';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { LessonSkeleton } from '~/components/estudiantes/layout/lessondetail/LessonDetailsSkeleton';
import { getActivityContent } from '~/server/actions/estudiantes/activities/getActivityContent';
import { getCourseById } from '~/server/actions/estudiantes/courses/getCourseById';
import { getLessonById } from '~/server/actions/estudiantes/lessons/getLessonById';
import { getLessonsByCourseId } from '~/server/actions/estudiantes/lessons/getLessonsByCourseId';
import { getUserLessonsProgress } from '~/server/actions/estudiantes/progress/getUserLessonsProgress';
import { isCourseOwnedByEducator } from '~/server/queries/educatorCourseAccess';
import { sortLessons } from '~/utils/lessonSorting';
import { getDashboardRouteByRole, getUserRole } from '~/utils/roles';

import LessonDetails from './LessonDetails';

import type { LessonWithProgress } from '~/types';
import type { CourseType } from '~/types';
import type { Roles } from '~/types/globals';

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

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  const role = getUserRole(sessionClaims?.metadata?.role);

  return (
    <>
      {/* Preconnect al dominio S3 para reducir latencia en carga de videos */}
      <link rel="preconnect" href="https://s3.us-east-2.amazonaws.com" />
      <link rel="dns-prefetch" href="https://s3.us-east-2.amazonaws.com" />
      <Header />
      <main>
        <Suspense fallback={<LessonSkeleton />}>
          <LessonContent id={id} userId={userId} role={role} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

// Move LessonContent to a separate file for better organization
async function LessonContent({
  id,
  userId,
  role,
}: {
  id: string;
  userId: string;
  role: Roles | undefined;
}) {
  try {
    const lessonId = Number.parseInt(id, 10);
    if (isNaN(lessonId)) {
      return notFound();
    }

    const lessonData = await getLessonById(lessonId, userId);
    if (!lessonData) {
      return notFound();
    }

    // Get course first to check if it's free
    const course = await getCourseById(lessonData.courseId, userId);
    if (!course) {
      return notFound();
    }

    // Un educador solo puede ver las clases de SUS cursos; el super-admin ve
    // todas. Ambos roles privilegiados omiten el gating de suscripción.
    const isPrivileged = role === 'educador' || role === 'super-admin';
    if (role === 'educador') {
      const ownsCourse = await isCourseOwnedByEducator(
        lessonData.courseId,
        userId
      );
      if (!ownsCourse) {
        redirect(getDashboardRouteByRole(role));
      }
    }

    const user = await currentUser();
    const metadata = user?.publicMetadata as
      | {
          planType?: string;
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
    const subscriptionEndDate = parseSubscriptionDate(
      metadata?.subscriptionEndDate
    );
    const now = new Date();
    const hasActiveSubscription =
      metadata?.subscriptionStatus === 'active' &&
      subscriptionEndDate !== null &&
      subscriptionEndDate > now;
    const hasPaidPlan = ['pro', 'premium', 'enterprise'].includes(
      (metadata?.planType ?? '').toLowerCase()
    );
    const hasExpiredSubscription =
      hasPaidPlan &&
      (metadata?.subscriptionStatus !== 'active' ||
        subscriptionEndDate === null ||
        subscriptionEndDate <= now);

    if (
      !isPrivileged &&
      (hasExpiredSubscription ||
        (requiresSubscription && !hasActiveSubscription))
    ) {
      redirect('/planes?subscription_expired=1');
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
    unstable_rethrow(error);
    return notFound();
  }
}
