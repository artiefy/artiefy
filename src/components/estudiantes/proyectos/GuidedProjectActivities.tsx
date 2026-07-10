'use client';

import { useState, useTransition } from 'react';

import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  LoaderCircle,
  LockKeyhole,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '~/lib/utils';
import { updateActivityProgress } from '~/server/actions/estudiantes/guided-projects/updateActivityProgress';

import type {
  GuidedObjective,
  GuidedObjectiveActivity,
} from '~/types/guided-projects';

interface GuidedProjectActivitiesProps {
  objectives: GuidedObjective[];
  isEnrolled: boolean;
  guidedProjectId: number;
  isSubscriptionValid?: boolean;
  introduction?: string | null;
}

const formatActivityDates = (
  startDate: Date | null,
  endDate: Date | null
): string | null => {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  const formattedStart =
    start && isValid(start)
      ? format(start, 'd MMM yyyy', { locale: es })
      : null;
  const formattedEnd =
    end && isValid(end) ? format(end, 'd MMM yyyy', { locale: es }) : null;

  if (formattedStart && formattedEnd) {
    return `${formattedStart} – ${formattedEnd}`;
  }

  return formattedStart ?? formattedEnd;
};

export function GuidedProjectActivities({
  objectives,
  isEnrolled,
  guidedProjectId,
  isSubscriptionValid = true,
  introduction,
}: GuidedProjectActivitiesProps) {
  const firstObjective = objectives[0];
  const [expandedObjectiveId, setExpandedObjectiveId] = useState<number | null>(
    () => firstObjective?.id ?? null
  );
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(
    () => firstObjective?.activities?.[0]?.id ?? null
  );
  const [optimisticProgress, setOptimisticProgress] = useState<
    Record<number, boolean>
  >({});
  const [pendingActivityId, setPendingActivityId] = useState<number | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const isActivityCompleted = (activity: GuidedObjectiveActivity) =>
    optimisticProgress[activity.id] ?? activity.isCompleted ?? false;

  const toggleObjective = (objective: GuidedObjective) => {
    const willOpen = expandedObjectiveId !== objective.id;
    setExpandedObjectiveId(willOpen ? objective.id : null);

    if (willOpen) {
      setExpandedActivityId(objective.activities?.[0]?.id ?? null);
    }
  };

  const toggleActivityStatus = (
    activityId: number,
    currentCompleted: boolean,
    objectiveEnabled: boolean
  ) => {
    if (!isEnrolled || !objectiveEnabled || !isSubscriptionValid) {
      return;
    }

    const newStatus = !currentCompleted;
    setOptimisticProgress((current) => ({
      ...current,
      [activityId]: newStatus,
    }));
    setPendingActivityId(activityId);

    startTransition(async () => {
      try {
        const result = await updateActivityProgress({
          activityId,
          isCompleted: newStatus,
        });

        if (!result.success) {
          toast.error(result.message || 'Error al actualizar la actividad');
          setOptimisticProgress((current) => ({
            ...current,
            [activityId]: currentCompleted,
          }));
          return;
        }

        toast.success(
          newStatus
            ? 'Actividad completada'
            : 'Actividad marcada como pendiente'
        );
      } catch {
        toast.error('No se pudo actualizar la actividad');
        setOptimisticProgress((current) => ({
          ...current,
          [activityId]: currentCompleted,
        }));
      } finally {
        setPendingActivityId(null);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/15 text-accent">
          <Target className="size-4" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Objetivos</h2>
      </div>

      {introduction?.trim() && (
        <p className="mb-6 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
          {introduction}
        </p>
      )}

      {objectives.length === 0 ? (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          Aún no hay sesiones disponibles para este proyecto.
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map((objective, objectiveIndex) => {
            const activities = objective.activities ?? [];
            const isObjectiveOpen = expandedObjectiveId === objective.id;
            const completedActivities = activities.filter((activity) =>
              isActivityCompleted(activity)
            ).length;
            const isObjectiveCompleted =
              activities.length > 0 &&
              completedActivities === activities.length;
            const objectiveButtonId = `guided-project-${guidedProjectId}-objective-${objective.id}-trigger`;
            const objectivePanelId = `guided-project-${guidedProjectId}-objective-${objective.id}-panel`;

            return (
              <div
                key={objective.id}
                className={cn(
                  'overflow-hidden rounded-lg border border-border/50',
                  !objective.isEnabled && 'opacity-75'
                )}
              >
                <button
                  id={objectiveButtonId}
                  type="button"
                  aria-expanded={isObjectiveOpen}
                  aria-controls={objectivePanelId}
                  onClick={() => toggleObjective(objective)}
                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                >
                  <span
                    className={cn(
                      'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                      isObjectiveCompleted
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isObjectiveCompleted ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : (
                      objectiveIndex + 1
                    )}
                  </span>

                  <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2">
                      {!objective.isEnabled && (
                        <LockKeyhole
                          className="size-3.5 shrink-0 text-amber-400"
                          aria-hidden="true"
                        />
                      )}
                      <span className="sr-only">
                        Sesión {objectiveIndex + 1}:{' '}
                      </span>
                      <span className="truncate">{objective.title}</span>
                    </span>
                  </span>

                  <span className="mr-1 text-xs whitespace-nowrap text-muted-foreground sm:mr-2">
                    {completedActivities}/{activities.length}
                    <span className="hidden sm:inline">
                      {' '}
                      {activities.length === 1 ? 'actividad' : 'actividades'}
                    </span>
                  </span>

                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isObjectiveOpen && 'rotate-180'
                    )}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={objectivePanelId}
                  role="region"
                  aria-labelledby={objectiveButtonId}
                  hidden={!isObjectiveOpen}
                  className="border-t border-border/50 bg-muted/20"
                >
                  {objective.description?.trim() && (
                    <p className="border-b border-border/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                      {objective.description}
                    </p>
                  )}

                  {activities.length === 0 && (
                    <p className="p-4 text-center text-sm text-muted-foreground">
                      No hay actividades registradas en esta sesión.
                    </p>
                  )}

                  {activities.map((activity, activityIndex) => {
                    const isCompleted = isActivityCompleted(activity);
                    const isActivityOpen = expandedActivityId === activity.id;
                    const isBlocked = !objective.isEnabled;
                    const cannotUpdate =
                      !isEnrolled || isBlocked || !isSubscriptionValid;
                    const activityButtonId = `guided-project-${guidedProjectId}-activity-${activity.id}-trigger`;
                    const activityPanelId = `guided-project-${guidedProjectId}-activity-${activity.id}-panel`;
                    const activityDates = formatActivityDates(
                      activity.startDate,
                      activity.endDate
                    );
                    const actionLabel = !isEnrolled
                      ? 'Inscríbete para completar'
                      : isBlocked
                        ? 'Actividad bloqueada'
                        : !isSubscriptionValid
                          ? 'Renueva tu plan para completar'
                          : isCompleted
                            ? 'Marcar como pendiente'
                            : 'Completar actividad';

                    return (
                      <div
                        key={activity.id}
                        className="border-b border-border/30 last:border-b-0"
                      >
                        <button
                          id={activityButtonId}
                          type="button"
                          aria-expanded={isActivityOpen}
                          aria-controls={activityPanelId}
                          onClick={() =>
                            setExpandedActivityId(
                              isActivityOpen ? null : activity.id
                            )
                          }
                          className="w-full p-4 text-left transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                        >
                          <span className="mb-1 block text-xs text-muted-foreground">
                            Actividad {activityIndex + 1}
                          </span>
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  isCompleted
                                    ? 'text-foreground/70 line-through'
                                    : 'text-foreground'
                                )}
                              >
                                {activity.name}
                              </span>
                              {activity.weekNumber != null && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <CalendarDays
                                    className="size-3"
                                    aria-hidden="true"
                                  />
                                  Semana {activity.weekNumber}
                                </span>
                              )}
                            </span>

                            <span className="flex shrink-0 items-center gap-2">
                              {isBlocked ? (
                                <LockKeyhole
                                  className="size-3.5 text-amber-400"
                                  aria-label="Actividad bloqueada"
                                />
                              ) : isCompleted ? (
                                <CheckCircle2
                                  className="size-4 text-emerald-400"
                                  aria-label="Actividad completada"
                                />
                              ) : null}
                              <ChevronDown
                                className={cn(
                                  'size-4 text-muted-foreground transition-transform',
                                  isActivityOpen && 'rotate-180'
                                )}
                                aria-hidden="true"
                              />
                            </span>
                          </span>
                        </button>

                        <div
                          id={activityPanelId}
                          role="region"
                          aria-labelledby={activityButtonId}
                          hidden={!isActivityOpen}
                          className="space-y-3 px-4 pb-4"
                        >
                          {activity.description?.trim() && (
                            <div className="rounded-lg bg-muted/30 p-3">
                              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                                Descripción
                              </span>
                              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                                {activity.description}
                              </p>
                            </div>
                          )}

                          {activityDates && (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              <span>
                                <span className="font-medium">Fechas:</span>{' '}
                                {activityDates}
                              </span>
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={cannotUpdate || isPending}
                              aria-busy={pendingActivityId === activity.id}
                              onClick={() =>
                                toggleActivityStatus(
                                  activity.id,
                                  isCompleted,
                                  objective.isEnabled
                                )
                              }
                              className={cn(
                                'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                                isCompleted
                                  ? 'border border-input bg-background text-foreground hover:bg-muted'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              )}
                            >
                              {pendingActivityId === activity.id ? (
                                <LoaderCircle
                                  className="size-3.5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : cannotUpdate ? (
                                <LockKeyhole
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              ) : isCompleted ? (
                                <Circle
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Check
                                  className="size-3.5"
                                  aria-hidden="true"
                                />
                              )}
                              {actionLabel}
                            </button>
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
      )}
    </section>
  );
}
