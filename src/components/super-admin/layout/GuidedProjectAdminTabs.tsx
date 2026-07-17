'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CodeXml,
  FileBox,
  FileText,
  ImageOff,
  Layers,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  MessageSquare,
  Package,
  Pencil,
  Rocket,
  Send,
  Target,
  Trash2,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '~/components/educators/ui/badge';
import { Button } from '~/components/educators/ui/button';
import { Card, CardHeader, CardTitle } from '~/components/educators/ui/card';
import { ModalFormGuidedActivity } from '~/components/super-admin/modals/ModalFormGuidedActivity';
import { ModalFormGuidedObjective } from '~/components/super-admin/modals/ModalFormGuidedObjective';
import { ModalGuidedProjectForm } from '~/components/super-admin/modals/ModalGuidedProjectForm';

import type { GuidedProject } from '~/types';

interface GuidedProjectAdminTabsProps {
  project: GuidedProject;
}

type TabKey = 'proyecto' | 'actividades' | 'recursos' | 'foro';

const predefinedColors = ['#1f2937', '#000000', '#FFFFFF'];

const splitLines = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

const splitTags = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

const sectionClass =
  'rounded-2xl border border-cyan-500/20 bg-slate-800 p-6 md:p-8';
const sectionIconClass =
  'flex size-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/15 text-cyan-300';

export function GuidedProjectAdminTabs({
  project,
}: GuidedProjectAdminTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'proyecto';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF');
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const objectives = project.objectives ?? [];

  const [expandedObjectiveId, setExpandedObjectiveId] = useState<number | null>(
    objectives[0]?.id ?? null
  );
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [editingObjectiveId, setEditingObjectiveId] = useState<number | null>(
    null
  );
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalObjectiveId, setActivityModalObjectiveId] = useState<
    number | null
  >(null);
  const [editingActivityId, setEditingActivityId] = useState<number | null>(
    null
  );
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(
    null
  );

  useEffect(() => {
    const savedColor = localStorage.getItem(
      `selectedColor_project_${project.id}`
    );
    if (savedColor) setSelectedColor(savedColor);
  }, [project.id]);

  const handlePredefinedColorChange = (color: string) => {
    setSelectedColor(color);
    localStorage.setItem(`selectedColor_project_${project.id}`, color);
  };

  const handleDeleteProject = async () => {
    if (!confirm('¿Estás seguro de eliminar este proyecto guiado?')) return;
    try {
      const response = await fetch(`/api/guided-projects?id=${project.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Proyecto eliminado');
      router.push('/dashboard/super-admin/proyectos-guiados');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const handleToggleObjective = async (
    objectiveId: number,
    isEnabled: boolean
  ) => {
    try {
      const response = await fetch(
        `/api/guided-projects/${project.id}/objectives?id=${objectiveId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: !isEnabled }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar');
      toast.success(isEnabled ? 'Sesión deshabilitada' : 'Sesión habilitada');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('No se pudo actualizar el estado de la sesión');
    }
  };

  const handleDeleteObjective = async (objectiveId: number) => {
    if (!confirm('¿Eliminar esta sesión? Se eliminarán sus actividades.'))
      return;
    try {
      const response = await fetch(
        `/api/guided-projects/${project.id}/objectives?id=${objectiveId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Sesión eliminada');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la sesión');
    }
  };

  const handleDeleteActivity = async (
    objectiveId: number,
    activityId: number
  ) => {
    if (!confirm('¿Eliminar esta actividad?')) return;
    try {
      const response = await fetch(
        `/api/guided-projects/${project.id}/objectives/${objectiveId}/activities?id=${activityId}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Actividad eliminada');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar actividad');
    }
  };

  const prerequisites = splitLines(project.prerequisites);
  const techStack = splitTags(project.techStack);
  const deliverables = splitLines(project.deliverablesDescription);
  const howItWorksText = project.howItWorks?.trim() ?? '';
  const hasEducatorInfo = Boolean(
    project.instructorName ||
    project.instructorProfesion ||
    project.instructorDescripcion
  );

  const navItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'proyecto', label: 'Proyecto', icon: <Rocket className="size-4" /> },
    {
      key: 'actividades',
      label: 'Actividades',
      icon: <Layers className="size-4" />,
    },
    {
      key: 'recursos',
      label: 'Recursos',
      icon: <FileBox className="size-4" />,
    },
    { key: 'foro', label: 'Foro', icon: <MessageSquare className="size-4" /> },
  ];

  return (
    <div>
      {/* Card principal (hero) */}
      <div className="relative w-full">
        <Card
          className="
            zoom-in relative mt-3 h-auto overflow-hidden border-2
            border-cyan-500/30 bg-slate-800 p-4 shadow-2xl transition-all
            duration-500 ease-out
            hover:border-cyan-500/60 hover:shadow-cyan-500/30
            sm:p-8
          "
        >
          <CardHeader
            className="
              grid w-full grid-cols-1 gap-6 border-b border-cyan-500/20 p-0 pb-8
              md:grid-cols-2 md:gap-12
            "
          >
            <div className="space-y-3">
              <p className="text-sm font-semibold tracking-widest text-cyan-400 uppercase">
                Detalles del Proyecto
              </p>
              <CardTitle className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {project.title}
              </CardTitle>
              {project.subtitle && (
                <p className="text-white/70">{project.subtitle}</p>
              )}
            </div>
            <div className="flex flex-col justify-start gap-4">
              <p className="flex items-center gap-2 text-sm font-bold tracking-wider text-cyan-400 uppercase">
                Tema Visual
              </p>
              <div className="flex flex-wrap gap-3">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handlePredefinedColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`
                      size-12 rounded-xl border-2 transition-all duration-300
                      hover:scale-125 hover:shadow-lg hover:shadow-cyan-500/50
                      ${
                        selectedColor === color
                          ? 'scale-110 border-white shadow-lg ring-2 ring-cyan-400 ring-offset-2'
                          : 'border-white/20 hover:border-cyan-400'
                      }
                    `}
                    title={`Cambiar tema a ${color}`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="order-2 space-y-6 md:order-1">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Categoría
                  </p>
                  <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                    {project.category?.name ?? 'N/A'}
                  </Badge>
                </div>
                {project.modalidad?.name && (
                  <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm">
                    <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                      Modalidad
                    </p>
                    <Badge className="border-cyan-500/50 bg-cyan-500/20 text-sm text-cyan-300">
                      {project.modalidad.name}
                    </Badge>
                  </div>
                )}
                <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-cyan-400 uppercase">
                    Estado
                  </p>
                  <Badge
                    className={`text-sm ${
                      project.isActive
                        ? 'border-green-500/50 bg-green-500/20 text-green-300'
                        : 'border-red-500/50 bg-red-500/20 text-red-300'
                    }`}
                  >
                    {project.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-xl border border-cyan-500/30 bg-white/5 p-5 backdrop-blur-sm">
                <h3 className="mb-3 text-sm font-bold tracking-wide text-cyan-400 uppercase">
                  Descripción
                </h3>
                <p className="text-sm leading-relaxed text-white/80">
                  {project.description || 'Sin descripción'}
                </p>
              </div>

              <div className="rounded-xl border-2 border-cyan-500/40 bg-cyan-500/10 p-6 backdrop-blur-sm">
                <h2 className="mb-4 text-sm font-bold tracking-wider text-cyan-400 uppercase">
                  Instructor Asignado
                </h2>
                <div className="flex items-center gap-2 rounded-full border border-primary bg-primary/20 px-4 py-2 text-sm text-white">
                  <span className="font-semibold text-white">
                    {project.instructorName ?? 'Sin asignar'}
                  </span>
                </div>
              </div>
            </div>

            <div className="order-1 flex w-full flex-col space-y-6 md:order-2">
              <div className="card-premium group relative aspect-video w-full overflow-hidden">
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 transition-opacity duration-300 group-hover:opacity-20" />
                {project.coverImageKey ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverImageKey}`}
                    alt={project.title}
                    width={400}
                    height={225}
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                    quality={85}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#3AF4EF]/20 to-[#01142B]/20">
                    <ImageOff className="size-10 text-white/40" />
                  </div>
                )}
              </div>

              {project.coverVideoKey && project.coverVideoKey !== 'none' && (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-cyan-500/30">
                  <video
                    controls
                    className="size-full object-cover"
                    aria-label={`Video de ${project.title}`}
                  >
                    <source
                      src={`${process.env.NEXT_PUBLIC_AWS_S3_URL}/${project.coverVideoKey}`}
                      type="video/mp4"
                    />
                    Tu navegador no soporta la reproducción de videos.
                  </video>
                </div>
              )}

              <div className="grid w-full grid-cols-2 gap-3">
                <Button
                  onClick={() => setEditProjectOpen(true)}
                  className="flex w-full items-center justify-center gap-1.5 bg-yellow-500 px-3 py-2 text-xs font-semibold text-white hover:bg-yellow-600 md:text-sm"
                >
                  <Pencil className="size-3.5" />
                  Editar
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  className="flex w-full items-center justify-center gap-1.5 bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 md:text-sm"
                >
                  <Trash2 className="size-3.5" />
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="relative z-10 mt-8 flex flex-wrap gap-2 rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(item.key)}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm
                font-medium transition-all
                ${
                  isActive
                    ? 'bg-cyan-500 text-black'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {/* Proyecto */}
        {activeTab === 'proyecto' && (
          <div className="space-y-6">
            {project.problemStatement?.trim() && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <div className={sectionIconClass}>
                    <TriangleAlert className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">El problema</h2>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-white/80">
                  {project.problemStatement}
                </p>
              </section>
            )}

            {howItWorksText && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <div className={sectionIconClass}>
                    <Lightbulb className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Cómo funciona
                  </h2>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-white/80">
                  {howItWorksText}
                </p>
              </section>
            )}

            {project.whatYouWillBuild?.trim() && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <div className={sectionIconClass}>
                    <Target className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Lo que vas a construir
                  </h2>
                </div>
                <p className="leading-relaxed whitespace-pre-line text-white/80">
                  {project.whatYouWillBuild}
                </p>
              </section>
            )}

            {prerequisites.length > 0 && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <div className={sectionIconClass}>
                    <ListChecks className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Requisitos previos
                  </h2>
                </div>
                <ul className="space-y-2">
                  {prerequisites.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-white/80"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {techStack.length > 0 && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <div className={sectionIconClass}>
                    <CodeXml className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Stack tecnológico
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs text-cyan-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {deliverables.length > 0 && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-2">
                  <div className={sectionIconClass}>
                    <Package className="size-4" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Qué vas a entregar
                  </h2>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {deliverables.map((item) => (
                    <li
                      key={item}
                      className="flex gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"
                    >
                      <Package className="mt-0.5 size-5 shrink-0 text-cyan-400" />
                      <span className="text-sm leading-relaxed text-white/90">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasEducatorInfo && (
              <section className={sectionClass}>
                <h2 className="mb-4 text-xl font-bold text-white">
                  Sobre el educador
                </h2>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {project.instructorName}
                  </h3>
                  {project.instructorProfesion && (
                    <p className="mt-0.5 text-sm font-medium text-cyan-300">
                      {project.instructorProfesion}
                    </p>
                  )}
                  {project.instructorDescripcion && (
                    <p className="mt-3 text-sm leading-relaxed text-white/80">
                      {project.instructorDescripcion}
                    </p>
                  )}
                </div>
              </section>
            )}

            {!project.problemStatement?.trim() &&
              !howItWorksText &&
              !project.whatYouWillBuild?.trim() &&
              prerequisites.length === 0 &&
              techStack.length === 0 &&
              deliverables.length === 0 &&
              !hasEducatorInfo && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-800/50 p-16 text-center">
                  <FileText className="size-10 text-white/30" />
                  <p className="text-sm text-white/50">
                    Este proyecto aún no tiene contenido enriquecido. Edítalo
                    para completar el problema, cómo funciona, stack, etc.
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Actividades */}
        {activeTab === 'actividades' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-white">
                Objetivos{' '}
                <span className="ml-2 inline-block rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-bold text-slate-950">
                  {objectives.length}
                </span>
              </h2>
              <Button
                onClick={() => {
                  setEditingObjectiveId(null);
                  setSessionModalOpen(true);
                }}
                className="bg-cyan-500 text-white hover:bg-cyan-600"
              >
                + Nueva sesión
              </Button>
            </div>

            {objectives.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-cyan-500/30 bg-slate-800/50 p-16 text-center">
                <ClipboardList className="size-10 text-white/30" />
                <p className="text-sm text-white/50">
                  No hay sesiones creadas todavía
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {objectives.map((objective, objectiveIndex) => {
                  const activities = objective.activities ?? [];
                  const isOpen = expandedObjectiveId === objective.id;

                  return (
                    <div
                      key={objective.id}
                      className={`overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-800/60 ${
                        !objective.isEnabled ? 'opacity-70' : ''
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const willOpen = !isOpen;
                          setExpandedObjectiveId(
                            willOpen ? objective.id : null
                          );
                          setExpandedActivityId(
                            willOpen ? (activities[0]?.id ?? null) : null
                          );
                        }}
                        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/5"
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
                          {objectiveIndex + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            {!objective.isEnabled && (
                              <LockKeyhole className="size-3.5 shrink-0 text-amber-400" />
                            )}
                            <span className="truncate font-semibold text-white">
                              {objective.title || 'Sin título'}
                            </span>
                          </span>
                        </span>
                        <span className="mr-1 text-xs whitespace-nowrap text-white/50">
                          {activities.length}{' '}
                          {activities.length === 1
                            ? 'actividad'
                            : 'actividades'}
                        </span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {isOpen && (
                        <div className="border-t border-cyan-500/10 bg-slate-900/40 p-4">
                          {objective.description && (
                            <p className="mb-4 text-sm leading-relaxed text-white/70">
                              {objective.description}
                            </p>
                          )}

                          <div className="mb-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleToggleObjective(
                                  objective.id,
                                  objective.isEnabled
                                )
                              }
                              className="border-white/20 text-white/70 hover:bg-white/10"
                            >
                              {objective.isEnabled
                                ? 'Deshabilitar sesión'
                                : 'Habilitar sesión'}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingObjectiveId(objective.id);
                                setSessionModalOpen(true);
                              }}
                              className="bg-yellow-500 text-white hover:bg-yellow-600"
                            >
                              Editar sesión
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleDeleteObjective(objective.id)
                              }
                              className="bg-red-500 text-white hover:bg-red-600"
                            >
                              Eliminar sesión
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setActivityModalObjectiveId(objective.id);
                                setEditingActivityId(null);
                                setActivityModalOpen(true);
                              }}
                              className="bg-cyan-500 text-white hover:bg-cyan-600"
                            >
                              + Nueva actividad
                            </Button>
                          </div>

                          {activities.length === 0 ? (
                            <p className="rounded-lg border border-dashed border-cyan-500/20 p-4 text-center text-sm text-white/50">
                              No hay actividades en esta sesión.
                            </p>
                          ) : (
                            <div className="overflow-hidden rounded-xl border border-cyan-500/10">
                              {activities.map((activity, activityIndex) => {
                                const detailHref = `/dashboard/super-admin/proyectos-guiados/${project.id}/${objective.id}/actividades/${activity.id}`;
                                const isActivityOpen =
                                  expandedActivityId === activity.id;
                                return (
                                  <div
                                    key={activity.id}
                                    className="border-b border-cyan-500/10 bg-slate-800/70 last:border-b-0"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedActivityId(
                                          isActivityOpen ? null : activity.id
                                        )
                                      }
                                      className="w-full p-4 text-left transition-colors hover:bg-white/5"
                                    >
                                      <span className="mb-1 block text-xs text-white/50">
                                        Actividad {activityIndex + 1}
                                      </span>
                                      <span className="flex items-center justify-between gap-3">
                                        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                                          <span className="text-sm font-medium text-white">
                                            {activity.name}
                                          </span>
                                          {activity.weekNumber != null && (
                                            <span className="flex items-center gap-1 text-xs text-white/50">
                                              <CalendarDays className="size-3" />
                                              Semana {activity.weekNumber}
                                            </span>
                                          )}
                                        </span>
                                        <span className="flex shrink-0 items-center gap-2">
                                          {activity.revisada && (
                                            <CheckCircle2
                                              className="size-4 text-emerald-400"
                                              aria-label="Revisada"
                                            />
                                          )}
                                          <ChevronDown
                                            className={`size-4 text-white/50 transition-transform ${isActivityOpen ? 'rotate-180' : ''}`}
                                          />
                                        </span>
                                      </span>
                                    </button>

                                    {isActivityOpen && (
                                      <div className="space-y-3 px-4 pb-4">
                                        {activity.description && (
                                          <div className="rounded-lg bg-white/5 p-3">
                                            <span className="mb-1 block text-xs font-medium text-white/50">
                                              Descripción
                                            </span>
                                            <p className="text-sm leading-relaxed text-white/80">
                                              {activity.description}
                                            </p>
                                          </div>
                                        )}

                                        <div className="flex flex-wrap gap-2">
                                          <Link
                                            href={detailHref}
                                            className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                                          >
                                            <BookOpen className="size-3.5" />
                                            Instrucción
                                          </Link>
                                          <Link
                                            href={detailHref}
                                            className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-cyan-400"
                                          >
                                            <Wrench className="size-3.5" />
                                            Construir
                                          </Link>
                                          <Link
                                            href={`${detailHref}#estudiantes`}
                                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-black hover:bg-emerald-400"
                                          >
                                            <Send className="size-3.5" />
                                            Entregar
                                          </Link>

                                          <button
                                            onClick={() => {
                                              setActivityModalObjectiveId(
                                                objective.id
                                              );
                                              setEditingActivityId(activity.id);
                                              setActivityModalOpen(true);
                                            }}
                                            className="ml-auto text-xs text-white/50 hover:text-white"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteActivity(
                                                objective.id,
                                                activity.id
                                              )
                                            }
                                            className="text-xs text-white/50 hover:text-red-400"
                                          >
                                            Eliminar
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recursos */}
        {activeTab === 'recursos' && (
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-800 p-8 text-center text-white/50">
            Los recursos del proyecto estarán disponibles pronto.
          </div>
        )}

        {/* Foro */}
        {activeTab === 'foro' && (
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-800 p-8 text-center text-white/50">
            El foro de este proyecto estará disponible pronto.
          </div>
        )}
      </div>

      <ModalGuidedProjectForm
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        projectId={project.id}
        onSuccess={() => router.refresh()}
      />

      <ModalFormGuidedObjective
        open={sessionModalOpen}
        onOpenChange={setSessionModalOpen}
        projectId={project.id}
        objectiveId={editingObjectiveId}
        orderIndex={objectives.length}
        onSuccess={() => router.refresh()}
      />

      {activityModalObjectiveId !== null && (
        <ModalFormGuidedActivity
          open={activityModalOpen}
          onOpenChange={setActivityModalOpen}
          projectId={project.id}
          objectiveId={activityModalObjectiveId}
          activityId={editingActivityId}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
