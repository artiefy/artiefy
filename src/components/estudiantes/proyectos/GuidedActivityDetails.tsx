'use client';

import { useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileDown,
  FileText,
  ImageIcon,
  Layers3,
  Menu,
  Send,
  X,
} from 'lucide-react';

import { GuidedActivitySubmissionDialog } from '~/components/estudiantes/proyectos/GuidedActivitySubmissionDialog';
import { Button } from '~/components/estudiantes/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/estudiantes/ui/dialog';
import { cn } from '~/lib/utils';

import type { KeyboardEvent } from 'react';

interface GuidedActivityNavigationItem {
  id: number;
  name: string;
  isCompleted: boolean;
}

interface GuidedActivityNavigationObjective {
  id: number;
  title: string;
  orderIndex: number;
  activities: GuidedActivityNavigationItem[];
}

interface GuidedActivityResource {
  name: string;
  url: string;
}

interface GuidedActivityDetailsProps {
  projectId: number;
  projectTitle: string;
  currentObjectiveId: number;
  objectiveTitle: string;
  objectiveDescription: string | null;
  activity: {
    id: number;
    name: string;
    description: string | null;
    weekNumber: number | null;
    dateLabel: string | null;
  };
  coverImageUrl: string | null;
  coverVideoUrl: string | null;
  resources: GuidedActivityResource[];
  objectives: GuidedActivityNavigationObjective[];
  progress: number;
}

interface GuidedActivitySyllabusProps {
  idPrefix: string;
  projectId: number;
  currentActivityId: number;
  objectives: GuidedActivityNavigationObjective[];
  expandedObjectiveIds: Set<number>;
  onToggleObjective: (objectiveId: number) => void;
  onNavigate?: () => void;
}

type ActivityTab = 'activity' | 'resources';

function GuidedActivitySyllabus({
  idPrefix,
  projectId,
  currentActivityId,
  objectives,
  expandedObjectiveIds,
  onToggleObjective,
  onNavigate,
}: GuidedActivitySyllabusProps) {
  return (
    <nav
      className="flex flex-col gap-2 p-3"
      aria-label="Objetivos y actividades del proyecto"
    >
      {objectives.map((objective, objectiveIndex) => {
        const isOpen = expandedObjectiveIds.has(objective.id);
        const completedActivities = objective.activities.filter(
          (item) => item.isCompleted
        ).length;
        const isObjectiveCompleted =
          objective.activities.length > 0 &&
          completedActivities === objective.activities.length;
        const triggerId = `${idPrefix}-objective-${objective.id}-trigger`;
        const panelId = `${idPrefix}-objective-${objective.id}-panel`;

        return (
          <div key={objective.id}>
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => onToggleObjective(objective.id)}
              className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isObjectiveCompleted
                    ? 'bg-primary/15 text-primary'
                    : 'bg-secondary text-muted-foreground group-hover:text-foreground'
                )}
              >
                {isObjectiveCompleted ? (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                ) : (
                  objectiveIndex + 1
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {objective.title}
                </span>
                <span className="mt-0.5 block text-[10px] text-muted-foreground">
                  {completedActivities}/{objective.activities.length}{' '}
                  {objective.activities.length === 1
                    ? 'completada'
                    : 'completadas'}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
            >
              {objective.activities.length > 0 ? (
                <div className="ml-5 flex flex-col gap-1 border-l-2 border-secondary py-2 pl-4">
                  {objective.activities.map((item) => {
                    const isCurrent = item.id === currentActivityId;
                    return (
                      <Link
                        key={item.id}
                        href={`/estudiantes/proyectos-guiados/${projectId}/actividades/${item.id}`}
                        aria-current={isCurrent ? 'page' : undefined}
                        onClick={onNavigate}
                        className={cn(
                          'group/activity flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                          isCurrent
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                        )}
                      >
                        <span className="shrink-0">
                          {item.isCompleted ? (
                            <CheckCircle2
                              className="size-4 text-primary"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className={cn(
                                'size-4 text-muted-foreground/50 transition-colors group-hover/activity:text-muted-foreground',
                                isCurrent && 'text-primary'
                              )}
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span
                          className={cn(
                            'min-w-0 flex-1 text-sm leading-tight',
                            isCurrent && 'font-medium'
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="sr-only">
                          {item.isCompleted ? 'Completada' : 'Pendiente'}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-3 text-xs text-muted-foreground">
                  Este objetivo no tiene actividades registradas.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function GuidedActivityDetails({
  projectId,
  projectTitle,
  currentObjectiveId,
  objectiveTitle,
  objectiveDescription,
  activity,
  coverImageUrl,
  coverVideoUrl,
  resources,
  objectives,
  progress,
}: GuidedActivityDetailsProps) {
  const [activeTab, setActiveTab] = useState<ActivityTab>('activity');
  const [isDesktopSyllabusOpen, setIsDesktopSyllabusOpen] = useState(true);
  const [isMobileSyllabusOpen, setIsMobileSyllabusOpen] = useState(false);
  const [isSubmissionOpen, setIsSubmissionOpen] = useState(false);
  const [expandedObjectiveIds, setExpandedObjectiveIds] = useState<Set<number>>(
    () => new Set([currentObjectiveId])
  );
  const tabRefs = useRef<Record<ActivityTab, HTMLButtonElement | null>>({
    activity: null,
    resources: null,
  });
  const activities = objectives.flatMap((objective) => objective.activities);
  const currentActivityIndex = activities.findIndex(
    (item) => item.id === activity.id
  );
  const previousActivity = activities[currentActivityIndex - 1];
  const nextActivity = activities[currentActivityIndex + 1];
  const currentNavigationActivity = activities[currentActivityIndex];
  const completedActivities = activities.filter(
    (item) => item.isCompleted
  ).length;
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const circleCircumference = 2 * Math.PI * 24;
  const circleOffset =
    circleCircumference - (normalizedProgress / 100) * circleCircumference;

  const activityHref = (activityId: number) =>
    `/estudiantes/proyectos-guiados/${projectId}/actividades/${activityId}`;

  const toggleObjective = (objectiveId: number) => {
    setExpandedObjectiveIds((current) => {
      const next = new Set(current);
      if (next.has(objectiveId)) {
        next.delete(objectiveId);
      } else {
        next.add(objectiveId);
      }
      return next;
    });
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    currentTab: ActivityTab
  ) => {
    const tabOrder: ActivityTab[] = ['activity', 'resources'];
    const currentIndex = tabOrder.indexOf(currentTab);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % tabOrder.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabOrder.length - 1;
    }

    if (nextIndex === null) return;
    const nextTab = tabOrder[nextIndex];
    if (!nextTab) return;

    event.preventDefault();
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <div className="relative min-h-[calc(100dvh-2.5rem)] overflow-x-clip bg-[#01152d] pt-12 text-foreground md:min-h-dvh md:pt-16">
      <header className="sticky top-[calc(var(--subscription-banner-height,0px)+env(safe-area-inset-top,0px)+5.5rem)] z-40 border-b border-border/40 bg-[#01152de8] px-3 py-2 backdrop-blur-xl md:top-[calc(var(--subscription-banner-height,0px)+4rem)] md:px-4">
        <div className="mx-auto grid max-w-[1800px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden size-10 rounded-full bg-card/80 lg:inline-flex"
              onClick={() => setIsDesktopSyllabusOpen((current) => !current)}
              aria-label={
                isDesktopSyllabusOpen
                  ? 'Ocultar objetivos'
                  : 'Mostrar objetivos'
              }
              aria-expanded={isDesktopSyllabusOpen}
              aria-controls="guided-activity-desktop-syllabus"
            >
              {isDesktopSyllabusOpen ? (
                <X aria-hidden="true" />
              ) : (
                <Menu aria-hidden="true" />
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full bg-card/80 lg:hidden"
              onClick={() => setIsMobileSyllabusOpen(true)}
              aria-label="Abrir objetivos y actividades"
              aria-haspopup="dialog"
            >
              <Menu aria-hidden="true" />
            </Button>

            <Link
              href={`/estudiantes/proyectos-guiados/${projectId}`}
              className="group inline-flex min-w-0 items-center gap-2 rounded-full border border-border/50 bg-card/80 px-3 py-2.5 transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:px-4"
            >
              <ChevronLeft
                className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
              <span className="hidden max-w-56 truncate text-sm font-medium sm:inline">
                {projectTitle}
              </span>
              <span className="text-xs text-muted-foreground sm:hidden">
                {currentActivityIndex + 1}/{activities.length}
              </span>
            </Link>
          </div>

          <div
            className="hidden min-w-0 items-center justify-center gap-3 md:flex"
            role="progressbar"
            aria-label="Progreso de las actividades del proyecto"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={normalizedProgress}
          >
            <div className="flex max-w-3xl min-w-0 flex-1 items-center gap-3 rounded-full border border-border/50 bg-card/80 px-5 py-2.5 backdrop-blur-xl">
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                {currentActivityIndex + 1} / {activities.length}
              </span>
              <div
                className="flex min-w-0 flex-1 items-center gap-1"
                aria-hidden="true"
              >
                {activities.map((item) => (
                  <span
                    key={item.id}
                    className={cn(
                      'h-1.5 min-w-1 flex-1 rounded-full',
                      item.isCompleted
                        ? 'bg-primary'
                        : item.id === activity.id
                          ? 'bg-primary/60'
                          : 'bg-secondary'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <span className="hidden items-center gap-2 rounded-full border border-border/50 bg-card/80 px-4 py-2.5 text-sm font-medium sm:inline-flex">
              {currentNavigationActivity?.isCompleted ? (
                <CheckCircle2
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              {currentNavigationActivity?.isCompleted
                ? 'Completada'
                : 'Pendiente'}
            </span>

            <div className="flex items-center gap-1 rounded-full border border-border/50 bg-card/80 p-1">
              {previousActivity ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                >
                  <Link
                    href={activityHref(previousActivity.id)}
                    aria-label={`Actividad anterior: ${previousActivity.name}`}
                  >
                    <ChevronLeft aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  disabled
                  aria-label="No hay actividad anterior"
                >
                  <ChevronLeft aria-hidden="true" />
                </Button>
              )}
              {nextActivity ? (
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                >
                  <Link
                    href={activityHref(nextActivity.id)}
                    aria-label={`Actividad siguiente: ${nextActivity.name}`}
                  >
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  disabled
                  aria-label="No hay actividad siguiente"
                >
                  <ChevronRight aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-9.75rem)] gap-0 md:min-h-[calc(100dvh-8.25rem)]">
        {isDesktopSyllabusOpen && (
          <aside
            id="guided-activity-desktop-syllabus"
            className="sticky top-[calc(var(--subscription-banner-height,0px)+8.25rem)] hidden h-[calc(100dvh-var(--subscription-banner-height,0px)-8.25rem)] w-80 shrink-0 overflow-y-auto border-r border-border/40 bg-[#061c37e8] backdrop-blur-xl lg:block"
          >
            <div className="border-b border-border/40 p-6">
              <div className="flex items-center gap-4">
                <div
                  className="relative size-14 shrink-0"
                  role="progressbar"
                  aria-label="Progreso total del proyecto"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={normalizedProgress}
                >
                  <svg className="size-14 -rotate-90" aria-hidden="true">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      strokeWidth="4"
                      className="fill-none stroke-secondary"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={circleOffset}
                      className="fill-none stroke-primary transition-[stroke-dashoffset]"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {Math.round(normalizedProgress)}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold">Tu progreso</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {completedActivities} de {activities.length} actividades
                  </p>
                </div>
              </div>
            </div>

            <GuidedActivitySyllabus
              idPrefix="guided-desktop-syllabus"
              projectId={projectId}
              currentActivityId={activity.id}
              objectives={objectives}
              expandedObjectiveIds={expandedObjectiveIds}
              onToggleObjective={toggleObjective}
            />
          </aside>
        )}

        <main className="min-w-0 flex-1 px-4 py-5 md:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/40 bg-black shadow-2xl">
              {coverVideoUrl ? (
                <video
                  src={coverVideoUrl}
                  poster={coverImageUrl ?? undefined}
                  controls
                  playsInline
                  className="size-full object-contain"
                />
              ) : coverImageUrl ? (
                <Image
                  src={coverImageUrl}
                  alt={`Portada de ${objectiveTitle}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 75vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#061c37] to-[#01152d] text-muted-foreground">
                  <ImageIcon className="size-12" aria-hidden="true" />
                  <span className="text-sm">
                    Esta actividad no tiene multimedia.
                  </span>
                </div>
              )}
            </div>

            <div className="py-6">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-primary">
                  <Layers3 className="size-3.5" aria-hidden="true" />
                  {objectiveTitle}
                </span>
                {activity.weekNumber != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    Semana {activity.weekNumber}
                  </span>
                )}
                {activity.dateLabel && <span>{activity.dateLabel}</span>}
              </div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                {activity.name}
              </h1>
            </div>

            <div className="border-b border-border/50">
              <div
                role="tablist"
                aria-label="Contenido de la actividad"
                aria-orientation="horizontal"
                className="flex gap-2"
              >
                <button
                  ref={(node) => {
                    tabRefs.current.activity = node;
                  }}
                  id="guided-activity-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'activity'}
                  aria-controls="guided-activity-panel"
                  tabIndex={activeTab === 'activity' ? 0 : -1}
                  onClick={() => setActiveTab('activity')}
                  onKeyDown={(event) => handleTabKeyDown(event, 'activity')}
                  className={cn(
                    'rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    activeTab === 'activity'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Actividad
                </button>
                <button
                  ref={(node) => {
                    tabRefs.current.resources = node;
                  }}
                  id="guided-resources-tab"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'resources'}
                  aria-controls="guided-resources-panel"
                  tabIndex={activeTab === 'resources' ? 0 : -1}
                  onClick={() => setActiveTab('resources')}
                  onKeyDown={(event) => handleTabKeyDown(event, 'resources')}
                  className={cn(
                    'rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    activeTab === 'resources'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  Recursos
                </button>
              </div>
            </div>

            <section
              id="guided-activity-panel"
              role="tabpanel"
              aria-labelledby="guided-activity-tab"
              hidden={activeTab !== 'activity'}
              className="py-6"
            >
              <div className="rounded-xl border border-border/50 bg-card/40 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="mb-3 text-lg font-semibold text-foreground">
                      {activity.name}
                    </h2>
                    {activity.description?.trim() ? (
                      <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                        {activity.description}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Esta actividad no tiene una descripción registrada.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsSubmissionOpen(true)}
                    className="shrink-0 bg-gradient-to-r from-primary to-primary/80 text-slate-950 hover:from-primary hover:to-primary"
                  >
                    <Send data-icon="inline-start" aria-hidden="true" />
                    Entregar
                  </Button>
                </div>

                {objectiveDescription?.trim() && (
                  <div className="mt-5 border-t border-border/40 pt-5">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Objetivo
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                      {objectiveDescription}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section
              id="guided-resources-panel"
              role="tabpanel"
              aria-labelledby="guided-resources-tab"
              hidden={activeTab !== 'resources'}
              className="py-6"
            >
              {resources.length > 0 ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {resources.map((resource) => (
                    <li key={`${resource.url}-${resource.name}`}>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-4 transition-colors hover:border-primary/40 hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                          <FileDown className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {resource.name}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/30 p-8 text-center text-muted-foreground">
                  <FileText className="size-8" aria-hidden="true" />
                  <p className="text-sm">
                    Este objetivo no tiene recursos registrados.
                  </p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {nextActivity && (
        <Link
          href={activityHref(nextActivity.id)}
          className="fixed right-6 bottom-6 z-30 hidden max-w-xs items-center gap-4 rounded-2xl border border-border/50 bg-card/95 p-4 pr-6 shadow-xl backdrop-blur-xl transition-transform hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:flex"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChevronRight className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="mb-0.5 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Siguiente
            </span>
            <span className="block truncate text-sm font-medium text-foreground">
              {nextActivity.name}
            </span>
          </span>
        </Link>
      )}

      <Dialog
        open={isMobileSyllabusOpen}
        onOpenChange={setIsMobileSyllabusOpen}
      >
        <DialogContent className="top-0 left-0 h-dvh w-[min(20rem,90vw)] max-w-none translate-0 gap-0 rounded-none border-y-0 border-l-0 p-0 sm:max-w-none">
          <DialogHeader className="border-b border-border/40 p-6 pr-12 text-left">
            <DialogTitle>Objetivos</DialogTitle>
            <DialogDescription>
              Navega por las actividades del proyecto.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            <GuidedActivitySyllabus
              idPrefix="guided-mobile-syllabus"
              projectId={projectId}
              currentActivityId={activity.id}
              objectives={objectives}
              expandedObjectiveIds={expandedObjectiveIds}
              onToggleObjective={toggleObjective}
              onNavigate={() => setIsMobileSyllabusOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <GuidedActivitySubmissionDialog
        activityId={activity.id}
        activityName={activity.name}
        open={isSubmissionOpen}
        onOpenChange={setIsSubmissionOpen}
        projectId={projectId}
      />
    </div>
  );
}
