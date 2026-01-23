'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useRouter } from '@bprogress/next/app';
import { useAuth } from '@clerk/nextjs';
import { Award, BookOpen, ChevronRight, Clock, Play } from 'lucide-react';
import { FaCheck, FaCheckCircle, FaCrown, FaLock } from 'react-icons/fa';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '~/components/estudiantes/ui/alert';
import { Button } from '~/components/estudiantes/ui/button';
import { Icons } from '~/components/estudiantes/ui/icons';
import { isUserEnrolled } from '~/server/actions/estudiantes/courses/enrollInCourse';

import type { Course, MateriaWithCourse, Program } from '~/types';

interface ProgramContentProps {
  program: Program;
  isEnrolled: boolean;
  isSubscriptionActive: boolean;
}

export function ProgramContent({
  program,
  isEnrolled,
  isSubscriptionActive,
}: ProgramContentProps) {
  const router = useRouter({
    showProgress: true,
    startPosition: 0.3,
    disableSameURL: true,
  });
  const { userId } = useAuth();
  const [courseEnrollments, setCourseEnrollments] = useState<
    Record<number, boolean>
  >({});
  const [enrollmentCache, setEnrollmentCache] = useState<
    Record<number, boolean>
  >({});
  const [courseProgress, setCourseProgress] = useState<
    Record<number, { progress: number; isCompleted: boolean }>
  >({});
  const [courseLessons, setCourseLessons] = useState<
    Record<number, { duration: number; count: number }>
  >({});
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  const courses = useMemo(() => {
    const safeMateriasWithCursos =
      program.materias?.filter(
        (materia): materia is MateriaWithCourse & { curso: Course } =>
          materia.curso !== undefined && 'id' in materia.curso
      ) ?? [];

    const uniqueCourses = safeMateriasWithCursos.reduce(
      (acc, materia) => {
        if (!acc.some((item) => item.curso.id === materia.curso.id)) {
          acc.push(materia);
        }
        return acc;
      },
      [] as (MateriaWithCourse & { curso: Course })[]
    );

    return uniqueCourses.map((materia) => materia.curso);
  }, [program.materias]);

  useEffect(() => {
    const calculateCourseLessons = () => {
      const lessonsData: Record<number, { duration: number; count: number }> =
        {};

      courses.forEach((course) => {
        const lessons = course.lessons || [];
        const totalMinutes = lessons.reduce(
          (acc, lesson) => acc + (lesson.duration || 0),
          0
        );
        lessonsData[course.id] = {
          duration: totalMinutes,
          count: lessons.length,
        };
      });

      setCourseLessons(lessonsData);
    };

    calculateCourseLessons();
  }, [courses]);

  const getIsCompleted = useCallback(
    (course: Course) => {
      const progressEntry = courseProgress[course.id];
      if (progressEntry) return progressEntry.isCompleted;

      const courseAny = course as {
        isCompleted?: boolean;
        completed?: boolean;
        progress?: number;
      };
      return Boolean(
        courseAny.isCompleted ??
        courseAny.completed ??
        (courseAny.progress ?? 0) >= 100
      );
    },
    [courseProgress]
  );

  const completedCoursesCount = useMemo(
    () => courses.filter((course) => getIsCompleted(course)).length,
    [courses, getIsCompleted]
  );

  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      if (!userId) {
        setIsLoadingProgress(false);
        return;
      }
      try {
        const res = await fetch('/api/enrolled-courses');
        if (!res.ok) return;
        const raw = (await res.json()) as
          | { id: number; progress: number }[]
          | { courses?: { id: number; progress: number }[] };
        const data = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.courses)
            ? raw.courses
            : [];

        const progressMap: Record<
          number,
          { progress: number; isCompleted: boolean }
        > = {};
        const enrollmentMap: Record<number, boolean> = {};

        data.forEach((course) => {
          const isCompleted = (course.progress ?? 0) >= 100;
          progressMap[course.id] = {
            progress: course.progress ?? 0,
            isCompleted,
          };
          enrollmentMap[course.id] = true;
        });

        if (isMounted) {
          setCourseProgress(progressMap);
          setEnrollmentCache((prev) => ({ ...prev, ...enrollmentMap }));
          setCourseEnrollments((prev) => ({ ...prev, ...enrollmentMap }));
        }
      } catch (error) {
        console.error('Error al obtener progreso de cursos:', error);
      } finally {
        if (isMounted) {
          setIsLoadingProgress(false);
        }
      }
    };

    void fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  useEffect(() => {
    let isSubscribed = true;
    const checkTimeout = setTimeout(async () => {
      if (!userId) return;

      try {
        const checksNeeded = courses.filter(
          (course) => enrollmentCache[course.id] === undefined
        );

        if (checksNeeded.length === 0) return;

        const enrollmentChecks = await Promise.all(
          checksNeeded.map(async (course) => {
            try {
              const isEnrolled = await isUserEnrolled(course.id, userId);
              return [course.id, isEnrolled] as [number, boolean];
            } catch {
              return [course.id, false] as [number, boolean];
            }
          })
        );

        if (isSubscribed) {
          const newEnrollments = Object.fromEntries(enrollmentChecks);
          setEnrollmentCache((prev) => ({ ...prev, ...newEnrollments }));
          setCourseEnrollments((prev) => ({ ...prev, ...newEnrollments }));
        }
      } catch (error) {
        console.error('Error checking enrollments:', error);
      }
    }, 500);

    return () => {
      isSubscribed = false;
      clearTimeout(checkTimeout);
    };
  }, [userId, courses, enrollmentCache]);

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      {isEnrolled && !isSubscriptionActive && (
        <Alert
          variant="destructive"
          className="mb-6 border-2 border-red-500 bg-red-50"
        >
          <div className="flex items-center gap-3">
            <FaCrown className="size-8 text-red-500" />
            <div className="flex-1">
              <AlertTitle className="mb-2 text-xl font-bold text-red-700">
                ¡Tu suscripción Premium ha expirado!
              </AlertTitle>
              <AlertDescription className="text-base text-red-600">
                <p className="mb-4">
                  Para seguir accediendo a los cursos de este programa y
                  continuar tu aprendizaje, necesitas renovar tu suscripción
                  Premium.
                </p>
                <Button
                  onClick={() => router.push('/planes')}
                  className="transform rounded-lg bg-red-500 px-6 py-2 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-red-600 active:scale-95"
                >
                  <FaCrown className="mr-2" />
                  Renovar Suscripción Premium
                </Button>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground md:text-2xl">
              Cursos del programa
            </h2>
            {isEnrolled && (
              <p className="text-sm text-muted-foreground">
                {completedCoursesCount} de {courses.length} completados
              </p>
            )}
          </div>
        </div>
        <div className="inline-flex items-center rounded-full border border-primary/30 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
          {courses.length} cursos
        </div>
      </div>

      <div
        className={
          !isSubscriptionActive && isEnrolled
            ? 'pointer-events-none opacity-50 blur-[1px] filter'
            : ''
        }
      >
        <div className="space-y-3">
          {courses.length === 0 ? (
            <Alert className="mt-4">
              <AlertTitle>No hay cursos disponibles</AlertTitle>
              <AlertDescription>
                Este programa aún no tiene cursos creados. Estarán disponibles
                muy pronto.
              </AlertDescription>
            </Alert>
          ) : (
            courses.map((course, index) => {
              const isEnrolledCourse = !!courseEnrollments[course.id];
              const isCompleted = getIsCompleted(course);
              const courseNumber = index + 1;
              const coverImageUrl = course.coverImageKey
                ? `${process.env.NEXT_PUBLIC_AWS_S3_URL}/${course.coverImageKey}`
                : 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=400&h=225&fit=crop';

              const lessonData = courseLessons[course.id] || {
                duration: 0,
                count: 0,
              };
              const totalMinutes = lessonData.duration;
              const hours = totalMinutes / 60;
              const durationLabel =
                hours >= 1
                  ? `${hours.toFixed(1)} horas`
                  : `${totalMinutes} min`;
              const totalClasses = lessonData.count;

              return (
                <a
                  key={course.id}
                  href={`/estudiantes/cursos/${course.id}`}
                  className={`group flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40'
                      : 'border-border bg-[#01152d80] hover:border-primary/50'
                  }`}
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={coverImageUrl}
                      alt={course.title}
                      fill
                      className="h-full w-full object-cover"
                      sizes="96px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    {isEnrolled && (isLoadingProgress || isEnrolledCourse) && (
                      <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                        {isLoadingProgress ? (
                          <Icons.spinner className="h-3 w-3 text-white" />
                        ) : (
                          isEnrolledCourse && (
                            <FaCheck className="h-3 w-3 text-white" />
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Curso {courseNumber}
                      </span>
                      {isEnrolled && (
                        <>
                          {isLoadingProgress ? (
                            <div className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-[#0b2a4a] px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                              <Icons.spinner className="h-3 w-3" /> Cargando
                            </div>
                          ) : isCompleted ? (
                            <div className="inline-flex items-center rounded-full border border-transparent bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 transition-colors hover:bg-primary/80 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                              Completado
                            </div>
                          ) : isEnrolledCourse ? (
                            <div className="inline-flex items-center rounded-full border border-border/50 bg-[#0b2a4a] px-2.5 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none">
                              <Clock className="mr-1 h-3 w-3" /> En progreso
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                    <h3 className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                      {course.title}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {course.description || 'Descripción no disponible'}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-4 text-sm text-muted-foreground sm:flex">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {durationLabel}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {totalClasses} clases
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export function ProgramCertificationPanel({
  program,
  isEnrolled,
}: {
  program: Program;
  isEnrolled: boolean;
}) {
  const { userId } = useAuth();
  const [courseProgress, setCourseProgress] = useState<
    Record<number, { progress: number; isCompleted: boolean }>
  >({});
  const [showProgramCertModal, setShowProgramCertModal] = useState(false);

  const courses = useMemo(() => {
    const safeMateriasWithCursos =
      program.materias?.filter(
        (materia): materia is MateriaWithCourse & { curso: Course } =>
          materia.curso !== undefined && 'id' in materia.curso
      ) ?? [];

    const uniqueCourses = safeMateriasWithCursos.reduce(
      (acc, materia) => {
        if (!acc.some((item) => item.curso.id === materia.curso.id)) {
          acc.push(materia);
        }
        return acc;
      },
      [] as (MateriaWithCourse & { curso: Course })[]
    );

    return uniqueCourses.map((materia) => materia.curso);
  }, [program.materias]);

  useEffect(() => {
    let isMounted = true;
    const fetchProgress = async () => {
      if (!userId) return;
      try {
        const res = await fetch('/api/enrolled-courses');
        if (!res.ok) return;
        const data = (await res.json()) as { id: number; progress: number }[];

        const progressMap: Record<
          number,
          { progress: number; isCompleted: boolean }
        > = {};

        data.forEach((course) => {
          const isCompleted = (course.progress ?? 0) >= 100;
          progressMap[course.id] = {
            progress: course.progress ?? 0,
            isCompleted,
          };
        });

        if (isMounted) {
          setCourseProgress(progressMap);
        }
      } catch (error) {
        console.error('Error al obtener progreso de cursos:', error);
      }
    };

    void fetchProgress();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const getIsCompleted = useCallback(
    (course: Course) => {
      const progressEntry = courseProgress[course.id];
      if (progressEntry) return progressEntry.isCompleted;

      const courseAny = course as {
        isCompleted?: boolean;
        completed?: boolean;
        progress?: number;
      };
      return Boolean(
        courseAny.isCompleted ??
        courseAny.completed ??
        (courseAny.progress ?? 0) >= 100
      );
    },
    [courseProgress]
  );

  const completedCoursesCount = useMemo(
    () => courses.filter((course) => getIsCompleted(course)).length,
    [courses, getIsCompleted]
  );

  const programProgress = useMemo(() => {
    if (courses.length === 0) return 0;
    return Math.round((completedCoursesCount / courses.length) * 100);
  }, [completedCoursesCount, courses.length]);

  const canSeeProgramCertificate =
    isEnrolled &&
    courses.length > 0 &&
    completedCoursesCount === courses.length;
  const isProgramCertificateUnlocked = canSeeProgramCertificate;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
          <Award className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground md:text-2xl">
            Certificación Del Programa
          </h3>
          <p className="text-sm text-muted-foreground">
            Completa todos los cursos para desbloquear tu certificado
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-secondary p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Progreso hacia la certificación
          </span>
          <span className="text-sm font-bold text-primary">
            {programProgress}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
            style={{ width: `${programProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {completedCoursesCount} de {courses.length} cursos completados
        </p>
      </div>

      <div className="text-center">
        <button
          disabled={!isProgramCertificateUnlocked}
          onClick={() =>
            isProgramCertificateUnlocked && setShowProgramCertModal(true)
          }
          className={`inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition focus:ring-2 focus:ring-green-400/60 focus:ring-offset-2 focus:ring-offset-card focus:outline-none ${
            isProgramCertificateUnlocked
              ? 'border-green-500/30 bg-green-500/20 text-green-200 hover:bg-green-500/30'
              : 'cursor-not-allowed border-white/10 bg-white/5 text-white/60'
          }`}
        >
          {isProgramCertificateUnlocked ? (
            <FaCheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <FaLock className="h-4 w-4 text-white/70" />
          )}
          {isProgramCertificateUnlocked
            ? 'Ver tu certificado'
            : 'Certificado bloqueado'}
        </button>
      </div>

      {showProgramCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowProgramCertModal(false)}
              type="button"
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
                <Award className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-lg font-bold text-foreground">
                ¡Felicidades!
              </h4>
              <p className="text-sm text-muted-foreground">
                Has completado el programa. Tu certificado está listo para ser
                visualizado.
              </p>
              <Link href={`/estudiantes/certificados/programa/${program.id}`}>
                <Button className="w-full max-w-sm bg-amber-500 font-semibold text-white hover:bg-amber-600">
                  Ver tu certificado del programa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
