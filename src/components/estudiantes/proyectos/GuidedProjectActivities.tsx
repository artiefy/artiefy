'use client';

import { useState } from 'react';

import Link from 'next/link';

import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  LockKeyhole,
  Send,
  Target,
  Wrench,
} from 'lucide-react';

import { GuidedActivitySubmissionDialog } from '~/components/estudiantes/proyectos/GuidedActivitySubmissionDialog';
import { Button } from '~/components/estudiantes/ui/button';
import { cn } from '~/lib/utils';

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

const toCalendarDate = (value: Date | string | null) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return null;
    const [, year, month, day] = match;
    const parsedYear = Number(year);
    const parsedMonth = Number(month) - 1;
    const parsedDay = Number(day);
    const parsed = new Date(parsedYear, parsedMonth, parsedDay);
    return isValid(parsed) &&
      parsed.getFullYear() === parsedYear &&
      parsed.getMonth() === parsedMonth &&
      parsed.getDate() === parsedDay
      ? parsed
      : null;
  }

  if (!isValid(value)) return null;
  const usesUtcCalendar =
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0;
  return usesUtcCalendar
    ? new Date(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
    : new Date(value.getFullYear(), value.getMonth(), value.getDate());
};

const formatActivityDates = (
  startDate: Date | string | null,
  endDate: Date | string | null
): string | null => {
  const start = toCalendarDate(startDate);
  const end = toCalendarDate(endDate);
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

const compareActivities = (
  first: GuidedObjectiveActivity,
  second: GuidedObjectiveActivity
) => {
  const weekDifference =
    (first.weekNumber ?? Number.MAX_SAFE_INTEGER) -
    (second.weekNumber ?? Number.MAX_SAFE_INTEGER);
  if (weekDifference !== 0) return weekDifference;

  const firstDate =
    toCalendarDate(first.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const secondDate =
    toCalendarDate(second.startDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const dateDifference = firstDate - secondDate;
  return dateDifference !== 0 ? dateDifference : first.id - second.id;
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
  const [submissionActivity, setSubmissionActivity] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const isActivityCompleted = (activity: GuidedObjectiveActivity) =>
    activity.isCompleted ?? false;

  const toggleObjective = (objective: GuidedObjective) => {
    const willOpen = expandedObjectiveId !== objective.id;
    setExpandedObjectiveId(willOpen ? objective.id : null);

    if (willOpen) {
      setExpandedActivityId(objective.activities?.[0]?.id ?? null);
    }
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
            const activities = [...(objective.activities ?? [])].sort(
              compareActivities
            );
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
                    const cannotAccess =
                      !isEnrolled || isBlocked || !isSubscriptionValid;
                    const activityButtonId = `guided-project-${guidedProjectId}-activity-${activity.id}-trigger`;
                    const activityPanelId = `guided-project-${guidedProjectId}-activity-${activity.id}-panel`;
                    const buildHelpId = `guided-project-${guidedProjectId}-activity-${activity.id}-build-help`;
                    const activityDates = formatActivityDates(
                      activity.startDate,
                      activity.endDate
                    );
                    const accessLabel = !isEnrolled
                      ? 'Inscríbete para acceder'
                      : isBlocked
                        ? 'Actividad bloqueada'
                        : !isSubscriptionValid
                          ? 'Renueva tu plan para acceder'
                          : undefined;

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
                            {cannotAccess ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled
                                title={accessLabel}
                              >
                                <LockKeyhole
                                  data-icon="inline-start"
                                  aria-hidden="true"
                                />
                                Instrucción
                              </Button>
                            ) : (
                              <Button asChild variant="outline" size="sm">
                                <Link
                                  href={`/estudiantes/proyectos-guiados/${guidedProjectId}/actividades/${activity.id}`}
                                >
                                  <BookOpen
                                    data-icon="inline-start"
                                    aria-hidden="true"
                                  />
                                  Instrucción
                                </Link>
                              </Button>
                            )}

                            <div className="flex flex-col items-start gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-disabled="true"
                                aria-describedby={buildHelpId}
                                onClick={(event) => event.preventDefault()}
                                className="cursor-not-allowed border-accent/40 text-accent opacity-60"
                              >
                                <Wrench
                                  data-icon="inline-start"
                                  aria-hidden="true"
                                />
                                Construir
                              </Button>
                              <span
                                id={buildHelpId}
                                className="text-[11px] text-muted-foreground"
                              >
                                Disponible próximamente
                              </span>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              disabled={cannotAccess}
                              title={accessLabel}
                              onClick={() =>
                                setSubmissionActivity({
                                  id: activity.id,
                                  name: activity.name,
                                })
                              }
                              className="bg-gradient-to-r from-primary to-primary/80 text-slate-950 hover:from-primary hover:to-primary"
                            >
                              <Send
                                data-icon="inline-start"
                                aria-hidden="true"
                              />
                              Entregar
                            </Button>
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

      {submissionActivity && (
        <GuidedActivitySubmissionDialog
          activityId={submissionActivity.id}
          activityName={submissionActivity.name}
          projectId={guidedProjectId}
          open
          onOpenChange={(open) => {
            if (!open) setSubmissionActivity(null);
          }}
        />
      )}
    </section>
  );
}
