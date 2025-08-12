import { Suspense } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { auth } from '@clerk/nextjs/server';
import { FaCheckCircle } from 'react-icons/fa';

import Footer from '~/components/estudiantes/layout/Footer';
import { Header } from '~/components/estudiantes/layout/Header';
import { LessonSkeleton } from '~/components/estudiantes/layout/lessondetail/LessonDetailsSkeleton';
import { getActivityContent } from '~/server/actions/estudiantes/activities/getActivityContent';
import { getClassMeetingById } from '~/server/actions/estudiantes/classMeetings/getClassMeetingById';
import { getClassMeetingsByCourseId } from '~/server/actions/estudiantes/classMeetings/getClassMeetingsByCourseId';
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

    // --- PRIMERO INTENTA BUSCAR UNA LECCIÓN NORMAL ---
    const lessonData = await getLessonById(lessonId, userId);

    // Si existe una lección, renderiza como antes
    if (lessonData) {
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
      const activitiesWithProgress = (activityContent ?? []).map(
        (activity) => ({
          ...activity,
          isCompleted: activity.isCompleted ?? false,
          userProgress: activity.userProgress ?? 0,
        })
      );

      // Obtén la clase actual y todas las clases grabadas del curso
      const classMeeting = await getClassMeetingsByCourseId(course.id);
      const recordedMeetings = classMeeting.filter(
        (m) => typeof m.video_key === 'string' && m.video_key.length > 0
      );

      return (
        <>
          <LessonDetails
            lesson={lesson}
            activities={activitiesWithProgress}
            lessons={sortedLessonsWithProgress}
            userLessonsProgress={lessonsProgress}
            userActivitiesProgress={activitiesProgress}
            userId={userId}
            course={course}
          />
          <section>
            {/* Renderiza todas las clases grabadas */}
            <h2 className="mb-2 text-xl font-bold text-green-700">
              Clases Grabadas
            </h2>
            <div className="space-y-3">
              {recordedMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="overflow-hidden rounded-lg border bg-gray-50 transition-colors hover:bg-gray-100"
                >
                  <div className="flex w-full items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-green-500">
                        <FaCheckCircle className="mr-2 size-5" />
                      </span>
                      <span className="text-background font-medium">
                        {meeting.title}{' '}
                        <span className="ml-2 text-sm text-gray-500">
                          (
                          {typeof meeting.startDateTime === 'string'
                            ? new Date(
                                meeting.startDateTime
                              ).toLocaleDateString('es-CO')
                            : ''}
                          )
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/estudiantes/clases/${meeting.id}`}>
                        <button className="buttonclass text-background transition-none active:scale-95">
                          <div className="outline" />
                          <div className="state state--default">
                            <div className="icon">
                              {/* ...SVG icon igual que en CourseContent... */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                height="1.2em"
                                width="1.2em"
                              >
                                <g style={{ filter: 'url(#shadow)' }}>
                                  <path
                                    fill="currentColor"
                                    d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                                  />
                                  <path
                                    fill="currentColor"
                                    d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                                  />
                                </g>
                                <defs>
                                  <filter id="shadow">
                                    <feDropShadow
                                      floodOpacity="0.6"
                                      stdDeviation="0.8"
                                      dy="1"
                                      dx="0"
                                    />
                                  </filter>
                                </defs>
                              </svg>
                            </div>
                            <p>
                              <span style={{ '--i': 0 } as React.CSSProperties}>
                                V
                              </span>
                              <span style={{ '--i': 1 } as React.CSSProperties}>
                                e
                              </span>
                              <span style={{ '--i': 2 } as React.CSSProperties}>
                                r
                              </span>
                              <span style={{ '--i': 3 } as React.CSSProperties}>
                                {' '}
                              </span>
                              <span style={{ '--i': 4 } as React.CSSProperties}>
                                C
                              </span>
                              <span style={{ '--i': 5 } as React.CSSProperties}>
                                l
                              </span>
                              <span style={{ '--i': 6 } as React.CSSProperties}>
                                a
                              </span>
                              <span style={{ '--i': 7 } as React.CSSProperties}>
                                s
                              </span>
                              <span style={{ '--i': 8 } as React.CSSProperties}>
                                e
                              </span>
                            </p>
                          </div>
                          <div className="state state--sent">
                            <div className="icon">
                              {/* ...SVG icon igual que en CourseContent... */}
                              <svg
                                stroke="black"
                                strokeWidth="0.5px"
                                width="1.2em"
                                height="1.2em"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <g style={{ filter: 'url(#shadow)' }}>
                                  <path
                                    d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                                    fill="currentColor"
                                  />
                                  <path
                                    d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                                    fill="currentColor"
                                  />
                                </g>
                              </svg>
                            </div>
                            <p>
                              <span style={{ '--i': 5 } as React.CSSProperties}>
                                V
                              </span>
                              <span style={{ '--i': 6 } as React.CSSProperties}>
                                i
                              </span>
                              <span style={{ '--i': 7 } as React.CSSProperties}>
                                s
                              </span>
                              <span style={{ '--i': 8 } as React.CSSProperties}>
                                t
                              </span>
                              <span style={{ '--i': 9 } as React.CSSProperties}>
                                o
                              </span>
                              <span
                                style={{ '--i': 10 } as React.CSSProperties}
                              >
                                !
                              </span>
                            </p>
                          </div>
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="border-t bg-white px-6 py-4">
                    <video
                      controls
                      className="mt-2 w-full max-w-lg rounded shadow"
                      src={`https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${meeting.video_key}`}
                    >
                      Tu navegador no soporta el video.
                    </video>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      );
    }

    // --- SI NO EXISTE, BUSCA UNA CLASE GRABADA (ClassMeeting) ---
    const meeting = await getClassMeetingById(lessonId);
    if (meeting?.video_key) {
      return (
        <section className="mx-auto mt-8 max-w-3xl">
          <h2 className="mb-2 text-xl font-bold text-green-700">
            {meeting.title}
          </h2>
          <div className="rounded-lg border bg-gray-50 p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-green-500">
                <FaCheckCircle className="mr-2 size-5" />
              </span>
              <span className="text-background font-medium">
                {meeting.title}{' '}
                <span className="ml-2 text-sm text-gray-500">
                  (
                  {typeof meeting.startDateTime === 'string'
                    ? new Date(meeting.startDateTime).toLocaleDateString(
                        'es-CO'
                      )
                    : ''}
                  )
                </span>
              </span>
            </div>
            <video
              controls
              className="w-full max-w-lg rounded shadow"
              src={`https://s3.us-east-2.amazonaws.com/artiefy-upload/video_clase/${meeting.video_key}`}
            >
              Tu navegador no soporta el video.
            </video>
            <div className="mt-4">
              <Link href={`/estudiantes/cursos/${meeting?.courseId}`}>
                <button className="buttonclass text-background transition-none active:scale-95">
                  Volver al Curso
                </button>
              </Link>
            </div>
          </div>
        </section>
      );
    }

    // Si no existe ni lección ni clase grabada, muestra 404
    return notFound();
  } catch (error: unknown) {
    console.error(
      'Error al obtener los datos de la lección:',
      error instanceof Error ? error.message : String(error)
    );
    return notFound();
  }
}
