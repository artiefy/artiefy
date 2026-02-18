'use client';

import { useMemo } from 'react';

import {
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileUp,
  Lock,
  Rocket,
} from 'lucide-react';

import { cn } from '~/lib/utils';
import { sortLessons } from '~/utils/lessonSorting';

import type { Activity, Lesson } from '~/types';

interface CourseActivitiesProps {
  lessons?: Lesson[];
  isEnrolled: boolean;
}

interface ActivityTypeMeta {
  label: string;
  icon: typeof CircleHelp;
  color: string;
  bg: string;
}

type ActivityState = 'completed' | 'pending' | 'locked';

const resolveActivityType = (activity: Activity): ActivityTypeMeta => {
  const lowerName = activity.typeActi?.name?.toLowerCase?.() ?? '';
  const byId = activity.typeid;

  if (
    lowerName.includes('quiz') ||
    lowerName.includes('cuestion') ||
    byId === 2
  ) {
    return {
      label: 'Cuestionario',
      icon: CircleHelp,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    };
  }

  if (
    lowerName.includes('document') ||
    lowerName.includes('entrega') ||
    byId === 1
  ) {
    return {
      label: 'Entrega de documento',
      icon: FileUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    };
  }

  if (
    lowerName.includes('proyecto') ||
    lowerName.includes('avance') ||
    byId === 3
  ) {
    return {
      label: 'Autocompletado',
      icon: Rocket,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    };
  }

  if (lowerName.includes('general') || lowerName.includes('otro')) {
    return {
      label: 'General',
      icon: CircleHelp,
      color: 'text-[#94A3B8]',
      bg: 'bg-[#94A3B8]/10',
    };
  }

  return {
    label: activity.typeActi?.name ?? 'Actividad',
    icon: CircleHelp,
    color: 'text-indigo-300',
    bg: 'bg-indigo-400/10',
  };
};

const resolveStatusBadge = (
  activity: Activity,
  isLessonLocked: boolean,
  isEnrolled: boolean
): { label: string; className: string; state: ActivityState } => {
  const completed = activity.isCompleted || (activity.userProgress ?? 0) >= 100;

  if (!isEnrolled || isLessonLocked) {
    return {
      label: 'Bloqueado',
      className: 'border-[#1D283A] bg-[#1d283a80] text-[#94A3B8]',
      state: 'locked',
    };
  }

  if (completed) {
    const grade =
      typeof activity.finalGrade === 'number'
        ? `${Number(activity.finalGrade.toFixed(1))}/10`
        : 'Completado';

    return {
      label: grade,
      className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      state: 'completed',
    };
  }

  const progress = Math.round(activity.userProgress ?? 0);
  const progressLabel = progress > 0 ? `${progress}%` : 'Pendiente';

  return {
    label: progressLabel,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    state: 'pending',
  };
};

const formatDeadline = (
  value: Activity['fechaMaximaEntrega']
): string | null => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (!date || Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export function CourseActivities({
  lessons = [],
  isEnrolled,
}: CourseActivitiesProps) {
  const lessonsWithActivities = useMemo(() => {
    const sortedLessons = sortLessons(Array.isArray(lessons) ? lessons : []);
    return sortedLessons.filter(
      (lesson) =>
        Array.isArray(lesson.activities) && lesson.activities.length > 0
    );
  }, [lessons]);

  const stats = useMemo(() => {
    const total = lessonsWithActivities.reduce(
      (acc, lesson) => acc + (lesson.activities?.length ?? 0),
      0
    );

    const completed = lessonsWithActivities.reduce((acc, lesson) => {
      const completedPerLesson =
        lesson.activities?.filter(
          (activity) =>
            activity.isCompleted || (activity.userProgress ?? 0) >= 100
        ).length ?? 0;
      return acc + completedPerLesson;
    }, 0);

    const pending = Math.max(total - completed, 0);

    return { total, completed, pending };
  }, [lessonsWithActivities]);

  if (!lessonsWithActivities.length) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12"
        style={{ backgroundColor: 'rgba(6, 28, 55, 0.3)' }}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <CircleHelp className="h-8 w-8 text-black" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-100">
          No hay actividades disponibles
        </h3>
        <p className="text-center text-sm text-slate-300">
          Este curso aún no tiene actividades cargadas.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6 rounded-2xl">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-foreground">
          Actividades del curso
        </h3>
        <p className="text-sm text-[#94A3B8]">
          {stats.completed} completadas · {stats.pending} pendientes ·{' '}
          {stats.total} en total
        </p>

        <div className="my-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-400/10 p-1.5 text-purple-400">
              <CircleHelp className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-[#94A3B8]">Cuestionario</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-400/10 p-1.5 text-blue-400">
              <FileUp className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-[#94A3B8]">Entrega de documento</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-400/10 p-1.5 text-emerald-400">
              <Rocket className="h-3.5 w-3.5" />
            </div>
            {/* On small screens move this item to its own line */}
            <span className="w-full text-xs text-[#94A3B8] sm:w-auto">
              Autocompletado
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {lessonsWithActivities.map((lesson, lessonIndex) => {
          const isLessonLocked = !isEnrolled;
          const totalActivities = lesson.activities?.length ?? 0;
          const completedActivities =
            lesson.activities?.filter(
              (activity) =>
                activity.isCompleted || (activity.userProgress ?? 0) >= 100
            ).length ?? 0;

          return (
            <div key={lesson.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                  <span className="text-xs font-medium text-accent">
                    {lessonIndex + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium break-words text-[#f8fafc]">
                    {lesson.title}
                  </h4>
                  <span className="block text-xs text-[#94A3B8] sm:inline">
                    {completedActivities}/{totalActivities} completadas
                  </span>
                </div>
              </div>

              <div className="grid gap-2 pl-8">
                {lesson.activities?.map((activity) => {
                  const activityType = resolveActivityType(activity);
                  const statusBadge = resolveStatusBadge(
                    activity,
                    isLessonLocked,
                    isEnrolled
                  );
                  const deadlineText = formatDeadline(
                    activity.fechaMaximaEntrega ?? null
                  );
                  const Icon = activityType.icon;

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        'group flex items-center justify-between border p-3 transition-all duration-200 hover:cursor-pointer',
                        statusBadge.state === 'locked' && 'opacity-60'
                      )}
                      style={{
                        backgroundColor: '#061c3799',
                        borderColor: 'hsla(217, 33%, 17%, 0.5)',
                        borderRadius: '12px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#082345';
                        e.currentTarget.style.borderColor = '#1D283A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#061c3799';
                        e.currentTarget.style.borderColor =
                          'hsla(217, 33%, 17%, 0.5)';
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            activityType.bg,
                            activityType.color
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {activity.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                            <span>{activityType.label}</span>
                            {deadlineText && (
                              <>
                                <span>·</span>
                                <span>Fecha límite: {deadlineText}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0">
                        <div
                          className={cn(
                            'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                            statusBadge.className
                          )}
                        >
                          {statusBadge.state === 'locked' ? (
                            <Lock className="mr-1 h-3 w-3" />
                          ) : statusBadge.state === 'completed' ? (
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock3 className="mr-1 h-3 w-3" />
                          )}
                          {statusBadge.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
