'use client';

import { useState, useTransition } from 'react';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaCheckCircle, FaLock, FaRegCircle } from 'react-icons/fa';
import { toast } from 'sonner';

import { updateActivityProgress } from '~/server/actions/estudiantes/guided-projects/updateActivityProgress';

import type { GuidedObjective } from '~/types/guided-projects';

interface GuidedProjectActivitiesProps {
  objectives: GuidedObjective[];
  isEnrolled: boolean;
  guidedProjectId: number;
  isSubscriptionValid?: boolean;
}

export function GuidedProjectActivities({
  objectives,
  isEnrolled,
  guidedProjectId,
  isSubscriptionValid = true,
}: GuidedProjectActivitiesProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticProgress, setOptimisticProgress] = useState<
    Record<number, boolean>
  >({});

  const toggleActivityStatus = (
    activityId: number,
    currentCompleted: boolean,
    objectiveEnabled: boolean
  ) => {
    if (!isEnrolled || !objectiveEnabled || !isSubscriptionValid) {
      if (!isSubscriptionValid && isEnrolled) {
        toast.error(
          'Tu suscripción ha expirado. Renueva tu plan para marcar progreso.'
        );
      }
      return;
    }

    const newStatus = !currentCompleted;
    setOptimisticProgress((prev) => ({ ...prev, [activityId]: newStatus }));

    startTransition(async () => {
      const result = await updateActivityProgress({
        activityId,
        isCompleted: newStatus,
      });

      if (!result.success) {
        toast.error(result.message || 'Error al actualizar actividad');
        setOptimisticProgress((prev) => ({
          ...prev,
          [activityId]: currentCompleted,
        }));
      } else {
        toast.success(
          newStatus
            ? 'Actividad completada'
            : 'Actividad marcada como pendiente'
        );
      }
    });
  };

  if (!objectives || objectives.length === 0) {
    return (
      <div className="rounded-xl border border-[#1d283a] bg-[#061c37] p-8 text-center">
        <p className="text-[#94A3B8]">
          Aún no hay actividades disponibles para este proyecto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Actividades del Proyecto</h2>
      <div className="space-y-6">
        {objectives.map((objective) => (
          <div
            key={objective.id}
            className={`overflow-hidden rounded-xl border border-[#1d283a] bg-[#061c37] transition-all ${
              !objective.isEnabled || !isSubscriptionValid ? 'opacity-70' : ''
            }`}
          >
            <div className="border-b border-[#1d283a] bg-[#0b2747] p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  {!objective.isEnabled && (
                    <FaLock className="size-4 text-amber-400" />
                  )}
                  {objective.title}
                </h3>
              </div>
              {objective.description && (
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {objective.description}
                </p>
              )}
            </div>

            <div className="divide-y divide-[#1d283a]">
              {!objective.activities || objective.activities.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#94A3B8]">
                  No hay actividades registradas en este objetivo.
                </div>
              ) : (
                objective.activities.map((activity) => {
                  const isCompleted =
                    optimisticProgress[activity.id] ??
                    activity.isCompleted ??
                    false;

                  return (
                    <div
                      key={activity.id}
                      className={`flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${
                        !objective.isEnabled || !isSubscriptionValid
                          ? 'cursor-not-allowed'
                          : 'transition-colors hover:bg-[#0b223f]'
                      }`}
                    >
                      <button
                        type="button"
                        disabled={
                          !isEnrolled ||
                          !objective.isEnabled ||
                          isPending ||
                          !isSubscriptionValid
                        }
                        onClick={() =>
                          toggleActivityStatus(
                            activity.id,
                            isCompleted,
                            objective.isEnabled
                          )
                        }
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          !isEnrolled ||
                          !objective.isEnabled ||
                          !isSubscriptionValid
                            ? 'cursor-not-allowed text-slate-500'
                            : isCompleted
                              ? 'text-emerald-400 hover:text-emerald-300'
                              : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isCompleted ? (
                          <FaCheckCircle className="size-full" />
                        ) : (
                          <FaRegCircle className="size-full" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-base font-medium ${isCompleted ? 'text-white/70 line-through' : 'text-white'}`}
                          >
                            {activity.name}
                          </p>
                          {activity.weekNumber && (
                            <span className="inline-flex items-center rounded-full bg-[#22C4D3]/10 px-2 py-0.5 text-xs font-medium text-[#22C4D3]">
                              Semana {activity.weekNumber}
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="line-clamp-2 text-sm text-[#94A3B8]">
                            {activity.description}
                          </p>
                        )}
                        {(activity.startDate || activity.endDate) && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-[#9fb3cc]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                width="18"
                                height="18"
                                x="3"
                                y="4"
                                rx="2"
                                ry="2"
                              />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            {activity.startDate &&
                              format(new Date(activity.startDate), 'd MMM', {
                                locale: es,
                              })}
                            {activity.startDate && activity.endDate && ' - '}
                            {activity.endDate &&
                              format(new Date(activity.endDate), 'd MMM yyyy', {
                                locale: es,
                              })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
